const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Hospital = require('../models/Hospital');

// @desc    Get current user by checking all role cookies
// @route   GET /api/auth/me
// @access  Private
const getCurrentUser = async (req, res, next) => {
    try {
        const roles = ['patient', 'doctor', 'hospital', 'admin'];
        let decodedUser = null;

        let bearerToken = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            bearerToken = req.headers.authorization.split(' ')[1];
        }

        if (bearerToken) {
            try {
                const decoded = jwt.verify(bearerToken, process.env.JWT_ACCESS_SECRET);
                if (roles.includes(decoded.role)) {
                    decodedUser = decoded;
                }
            } catch (err) {}
        }

        if (!decodedUser) {
            for (const role of roles) {
                const token = req.cookies[`accessToken_${role}`];
                if (token) {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
                        if (decoded.role === role) {
                            decodedUser = decoded;
                            break;
                        }
                    } catch (err) {}
                }
            }
        }

        if (!decodedUser) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await User.findById(decodedUser.userId).select('-password');
        if (user) {
            if (user.status === 'blocked') {
                return res.status(403).json({ message: 'Account suspended' });
            }

            let profile = null;
            if (user.role === 'doctor') {
                profile = await Doctor.findOne({ user: user._id });
                
                // If hospital doctor is missing location or address, inherit from hospital
                if (profile && profile.hospitalId && (!profile.address || !user.location || user.location.coordinates[0] === 0)) {
                    const hospitalUser = await User.findById(profile.hospitalId).select('location');
                    const hospitalProfile = await Hospital.findOne({ user: profile.hospitalId }).select('address');
                    
                    if (hospitalUser && hospitalProfile) {
                        if (!profile.address) profile.address = hospitalProfile.address;
                        if (!user.location || user.location.coordinates[0] === 0) user.location = hospitalUser.location;
                        if (!user.address) user.address = hospitalProfile.address;
                    }
                }
            } else if (user.role === 'hospital') {
                profile = await Hospital.findOne({ user: user._id });
            }

            res.json({
                ...user.toObject(),
                doctorProfile: user.role === 'doctor' ? profile : null,
                hospitalProfile: user.role === 'hospital' ? profile : null
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get featured doctors and hospitals for landing page
// @route   GET /api/public/featured
// @access  Public
const getFeaturedData = async (req, res, next) => {
    try {
        const featuredDoctorsProfiles = await Doctor.find({ isFeatured: true })
            .populate({ path: 'user', select: 'name email phone status image' })
            .populate({ path: 'hospitalId', select: 'name' });
        
        const featuredDoctors = featuredDoctorsProfiles
            .filter(doc => doc.user && doc.user.status !== 'blocked')
            .map(doc => ({
                id: doc.user._id,
                name: doc.user.name,
                specialization: doc.specialization,
                experience: doc.experience,
                hospitalName: doc.hospitalId?.name || 'Independent',
                image: doc.user.image || null,
                address: doc.address || ''
            }));

        const featuredHospitalsProfiles = await Hospital.find({ isFeatured: true })
            .populate({ path: 'user', select: 'name email phone status image' });
        
        const featuredHospitals = featuredHospitalsProfiles
            .filter(hosp => hosp.user && hosp.user.status !== 'blocked')
            .map(hosp => ({
                id: hosp.user._id,
                name: hosp.user.name,
                facilityType: hosp.facilityType,
                beds: hosp.beds,
                image: hosp.coverImage || hosp.user.image || null,
                city: hosp.city || '',
                state: hosp.state || ''
            }));

        res.json({ doctors: featuredDoctors, hospitals: featuredHospitals });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);

        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.image = req.body.image || user.image;

            if (req.body.bloodGroup) user.bloodGroup = req.body.bloodGroup;
            if (req.body.location) user.location = req.body.location;
            
            // New fields for patients/common profile
            if (req.body.address) user.address = req.body.address;
            if (req.body.city) user.city = req.body.city;
            if (req.body.state) user.state = req.body.state;
            if (req.body.zip) user.zip = req.body.zip;
            if (req.body.dob) user.dob = req.body.dob;
            if (req.body.gender) user.gender = req.body.gender;
            if (req.body.height) user.height = req.body.height;
            if (req.body.weight) user.weight = req.body.weight;
            if (req.body.allergies) user.allergies = req.body.allergies;
            if (req.body.chronicConditions) user.chronicConditions = req.body.chronicConditions;
            if (req.body.emgName) user.emgName = req.body.emgName;
            if (req.body.emgRelation) user.emgRelation = req.body.emgRelation;
            if (req.body.emgPhone) user.emgPhone = req.body.emgPhone;

            const updatedUser = await user.save();

            let updatedProfile = null;
            if (user.role === 'doctor') {
                const doctor = await Doctor.findOne({ user: user._id });
                if (doctor) {
                    doctor.specialization = req.body.specialization || doctor.specialization;
                    doctor.experience = req.body.experience || doctor.experience;
                    doctor.licenseNumber = req.body.licenseNumber || doctor.licenseNumber;
                    doctor.qualifications = req.body.qualifications || doctor.qualifications;
                    doctor.about = req.body.about || doctor.about;
                    doctor.fee = req.body.fee || doctor.fee;
                    doctor.phone = req.body.phone || doctor.phone;
                    doctor.address = req.body.address || doctor.address;
                    
                    // Availability fields
                    doctor.isAcceptingAppointments = req.body.isAcceptingAppointments !== undefined ? req.body.isAcceptingAppointments : doctor.isAcceptingAppointments;
                    
                    // Only independent doctors can update their slots and days
                    if (!doctor.hospitalId) {
                        if (req.body.availableDays) doctor.availableDays = req.body.availableDays;
                        
                        if (req.body.slots) {
                            const sessions = req.body.slots;
                            // Validate slots
                            for (let i = 0; i < sessions.length; i++) {
                                // Start time before end time
                                if (sessions[i].start >= sessions[i].end) {
                                    return res.status(400).json({ message: `Session ${i + 1}: Start time must be before end time` });
                                }

                                // Overlap check
                                for (let j = i + 1; j < sessions.length; j++) {
                                    const s1 = sessions[i];
                                    const s2 = sessions[j];
                                    if (s1.start < s2.end && s2.start < s1.end) {
                                        return res.status(400).json({ message: `Session ${i + 1} and Session ${j + 1} overlap` });
                                    }
                                }
                            }
                            doctor.slots = sessions;
                        }
                        
                        if (req.body.maxTokens) doctor.maxTokens = req.body.maxTokens;
                    }

                    doctor.onlineConsultation = req.body.onlineConsultation !== undefined ? req.body.onlineConsultation : doctor.onlineConsultation;
                    if (doctor.hospitalId) doctor.onlineConsultation = false;
                    updatedProfile = await doctor.save();
                }
            } else if (user.role === 'hospital') {
                const hospital = await Hospital.findOne({ user: user._id });
                if (hospital) {
                    hospital.facilityType = req.body.facilityType || hospital.facilityType;
                    hospital.beds = req.body.beds || hospital.beds;
                    hospital.about = req.body.about || hospital.about;

                    hospital.address = req.body.address || hospital.address;
                    hospital.locality = req.body.locality || hospital.locality;
                    hospital.landmark = req.body.landmark || hospital.landmark;
                    hospital.city = req.body.city || hospital.city;
                    hospital.state = req.body.state || hospital.state;
                    hospital.zip = req.body.zip || hospital.zip;
                    hospital.establishYear = req.body.establishYear || hospital.establishYear;
                    hospital.coverImage = req.body.coverImage || hospital.coverImage;

                    if (req.body.facilities) {
                        hospital.facilities = req.body.facilities;
                    }

                    updatedProfile = await hospital.save();

                    // Update all doctors associated with this hospital if location/address changed
                    if (req.body.address || req.body.city || req.body.state || req.body.location) {
                        const newAddress = req.body.address || hospital.address;
                        const newCity = req.body.city || hospital.city;
                        const newState = req.body.state || hospital.state;
                        
                        // Construct a clean full address for doctors
                        const fullAddressParts = [];
                        if (newAddress) fullAddressParts.push(newAddress);
                        if (newCity) fullAddressParts.push(newCity);
                        if (newState) fullAddressParts.push(newState);
                        const fullAddress = fullAddressParts.join(', ');

                        // 1. Update Doctor profile addresses
                        await Doctor.updateMany(
                            { hospitalId: user._id },
                            { address: fullAddress }
                        );

                        // 2. Update associated User location coordinates if hospital location changed
                        if (req.body.location) {
                            const hospitalDoctors = await Doctor.find({ hospitalId: user._id });
                            const doctorUserIds = hospitalDoctors.map(d => d.user);
                            await User.updateMany(
                                { _id: { $in: doctorUserIds } },
                                { location: req.body.location }
                            );
                        }
                    }
                }
            }

            res.json({
                ...updatedUser.toObject(),
                doctorProfile: user.role === 'doctor' ? updatedProfile : null,
                hospitalProfile: user.role === 'hospital' ? updatedProfile : null
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Resolve a Google Maps link to extract coordinates
// @route   POST /api/auth/resolve-map-link
// @access  Private
const resolveMapLink = async (req, res, next) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ message: 'URL is required' });
        }

        let currentUrl = url.trim();

        // 1. SSRF check / domain verification
        try {
            const urlObj = new URL(currentUrl);
            const hostname = urlObj.hostname.toLowerCase();
            const isGoogleDomain = hostname === 'goo.gl' || 
                                   hostname === 'maps.app.goo.gl' || 
                                   hostname.endsWith('.google.com') || 
                                   hostname === 'google.com' ||
                                   /\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(hostname);
            if (!isGoogleDomain) {
                return res.status(400).json({ message: 'Only valid Google Maps URLs are allowed' });
            }
        } catch (err) {
            return res.status(400).json({ message: 'Invalid URL format' });
        }

        // 2. If it's a short link or redirect link, resolve it
        const axios = require('axios');
        let finalUrl = currentUrl;
        
        try {
            const response = await axios.get(currentUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                maxRedirects: 5,
                timeout: 7000
            });
            
            finalUrl = response.request.res.responseUrl || response.request.responseURL || currentUrl;
        } catch (error) {
            console.error('Redirect resolution failed, attempting parsing on original URL:', error.message);
        }

        // Validate final resolved URL hostname too (SSRF prevention)
        try {
            const finalUrlObj = new URL(finalUrl);
            const finalHostname = finalUrlObj.hostname.toLowerCase();
            const isFinalGoogleDomain = finalHostname.endsWith('.google.com') || 
                                        finalHostname === 'google.com' ||
                                        /\.google\.[a-z]{2,3}(\.[a-z]{2})?$/.test(finalHostname);
            if (!isFinalGoogleDomain) {
                return res.status(400).json({ message: 'Resolved destination is not a Google domain' });
            }
        } catch (err) {
            // ignore if URL parsing fails on redirect fallback
        }

        // 3. Extract coordinates using regex patterns
        let latitude = null;
        let longitude = null;

        // Pattern 1: @latitude,longitude (e.g. .../@12.9716,77.5946,17z...)
        const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (atMatch) {
            latitude = parseFloat(atMatch[1]);
            longitude = parseFloat(atMatch[2]);
        }

        // Pattern 2: !3dlatitude!4dlongitude (common in Google Maps place URLs)
        if (latitude === null || longitude === null) {
            const dataMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
            if (dataMatch) {
                latitude = parseFloat(dataMatch[1]);
                longitude = parseFloat(dataMatch[2]);
            }
        }

        // Pattern 3: Query parameters q=lat,lng or ll=lat,lng
        if (latitude === null || longitude === null) {
            try {
                const parsedUrl = new URL(finalUrl);
                const q = parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('query') || parsedUrl.searchParams.get('ll');
                if (q) {
                    const parts = q.split(',');
                    if (parts.length === 2) {
                        const lat = parseFloat(parts[0]);
                        const lng = parseFloat(parts[1]);
                        if (!isNaN(lat) && !isNaN(lng)) {
                            latitude = lat;
                            longitude = lng;
                        }
                    }
                }
            } catch (e) {}
        }

        // Pattern 4: direct path segment comma values in the original or final URL (e.g. /maps/12.9716,77.5946)
        if (latitude === null || longitude === null) {
            const pathParts = finalUrl.split('/');
            for (const part of pathParts) {
                const commaParts = part.split(',');
                if (commaParts.length === 2) {
                    const lat = parseFloat(commaParts[0]);
                    const lng = parseFloat(commaParts[1]);
                    if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
                        latitude = lat;
                        longitude = lng;
                        break;
                    }
                }
            }
        }

        if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({ message: 'Could not extract latitude and longitude from the provided Google Maps link' });
        }

        res.json({ latitude, longitude });
    } catch (error) {
        next(error);
    }
};

module.exports = { getCurrentUser, getFeaturedData, updateUserProfile, resolveMapLink };

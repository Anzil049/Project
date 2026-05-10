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
                image: doc.user.image || null
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
                image: hosp.user.image || null
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
                    updatedProfile = await hospital.save();
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

module.exports = { getCurrentUser, getFeaturedData, updateUserProfile };

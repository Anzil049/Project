/**
 * Checks if a user's profile is complete based on their role and required fields.
 * 
 * @param {Object} user - The user object from auth store
 * @returns {boolean} - True if profile is complete, false otherwise
 */
export const isProfileComplete = (user) => {
    if (!user) return false;

    // Admin role doesn't require profile completion in this context
    if (user.role === 'admin') return true;

    if (user.role === 'patient') {
        return !!(
            user.name && 
            user.phone && 
            user.bloodGroup && 
            user.dob && 
            user.gender && 
            user.address &&
            user.location?.coordinates?.[0] !== 0 &&
            user.location?.coordinates?.[1] !== 0
        );
    }

    if (user.role === 'doctor') {
        const dp = user.doctorProfile;
        if (!dp) return false;

        const hasRequiredProfessional = !!(
            user.name &&
            (user.phone || dp.phone) &&
            dp.specialization &&
            dp.qualifications &&
            dp.experience &&
            dp.licenseNumber
        );

        if (!hasRequiredProfessional) return false;

        // If affiliated with a hospital, we don't strictly require they set their own location/address
        if (dp.hospitalId) return true;

        // Independent doctors must have address and location
        return !!(
            dp.address &&
            user.location?.coordinates?.[0] !== 0 &&
            user.location?.coordinates?.[1] !== 0
        );
    }

    if (user.role === 'hospital') {
        const hp = user.hospitalProfile;
        if (!hp) return false;
        return !!(
            user.name &&
            (user.phone || hp.phone) &&
            hp.facilityType &&
            hp.beds &&
            hp.about &&
            hp.address &&
            hp.city &&
            hp.state &&
            hp.zip &&
            user.location?.coordinates?.[0] !== 0 &&
            user.location?.coordinates?.[1] !== 0
        );
    }

    return false;
};

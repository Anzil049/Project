const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const FACILITY_TYPES = ['Hospital', 'Clinic'];
const GENDERS = ['Male', 'Female', 'Other'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s-]{8,18}[0-9]$/;
const LICENSE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9/ ._-]*$/;
const PIN_PATTERN = /^[1-9][0-9]{5}$/;

module.exports = {
    BLOOD_GROUPS,
    FACILITY_TYPES,
    GENDERS,
    WEEK_DAYS,
    NAME_PATTERN,
    PHONE_PATTERN,
    LICENSE_PATTERN,
    PIN_PATTERN,
};

import { z } from 'zod';
import { BLOOD_GROUPS, FACILITY_TYPES, GENDERS, PIN_PATTERN } from './constants';
import {
  licenseNumberField,
  nameField,
  optionalCoordinateField,

  phoneField,
  positiveIntField,
  registrationNumberField,
  requiredCoordinateField,
  trimString,
} from './fields';

const pinCodeField = z.string()
  .trim()
  .optional()
  .or(z.literal(''))
  .refine((value) => !value || PIN_PATTERN.test(value), 'Enter a valid 6-digit PIN code');

export const patientProfileSchema = z.object({
  name: nameField,
  phone: phoneField,
  bloodGroup: z.enum(BLOOD_GROUPS, { message: 'Select a valid blood group' }),
  dob: z.string().refine((value) => {
    const date = new Date(value);
    if (!value || Number.isNaN(date.getTime())) return false;
    const today = new Date();
    const oldest = new Date();
    oldest.setFullYear(today.getFullYear() - 120);
    return date <= today && date >= oldest;
  }, 'Enter a valid date of birth'),
  gender: z.enum(GENDERS, { message: 'Select a valid gender' }),
  address: trimString('Address is required', 5, 240),
  city: trimString('City is required', 2, 80),
  state: trimString('State is required', 2, 80),
  zip: pinCodeField,
  emgName: nameField,
  emgRelation: trimString('Relationship is required', 2, 50),
  emgPhone: phoneField,
  latitude: requiredCoordinateField('latitude', -90, 90),
  longitude: requiredCoordinateField('longitude', -180, 180),
});

export const doctorProfileSchema = z.object({
  name: nameField,
  phone: phoneField,
  specialization: trimString('Specialization is required', 2, 80),
  experience: positiveIntField('Experience', 0, 70),
  licenseNumber: licenseNumberField,
  qualifications: trimString('Qualifications are required', 2, 160),
  fee: positiveIntField('Consultation fee', 0, 100000),
  clinicAddress: trimString('Clinic address is required', 5, 240).optional().or(z.literal('')),
  latitude: optionalCoordinateField('latitude', -90, 90),
  longitude: optionalCoordinateField('longitude', -180, 180),
});

export const hospitalProfileSchema = z.object({
  name: trimString('Hospital name is required', 3, 100),
  type: z.enum(FACILITY_TYPES, { message: 'Select a valid facility type' }),
  registrationNumber: registrationNumberField,
  phone: phoneField,
  about: trimString('Hospital description is required', 20, 1200),
  address: trimString('Street address is required', 5, 240),
  city: trimString('City is required', 2, 80),
  state: trimString('State is required', 2, 80),
  zip: pinCodeField,
  latitude: requiredCoordinateField('latitude', -90, 90),
  longitude: requiredCoordinateField('longitude', -180, 180),
});

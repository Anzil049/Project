import { z } from 'zod';
import { BLOOD_GROUPS, FACILITY_TYPES } from './constants';
import {
  emailField,
  licenseNumberField,
  matchingPasswordSchema,
  optionalText,
  passwordField,
  positiveIntField,
  registrationNumberField,
  requiredFile,
  trimString,
  nameField,
} from './fields';

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

export const patientSignupSchema = matchingPasswordSchema({
  fullName: nameField,
  email: emailField,
  bloodGroup: z.enum(BLOOD_GROUPS, { message: 'Select a valid blood group' }),
  password: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
});

export const doctorSignupSchema = matchingPasswordSchema({
  fullName: nameField,
  email: emailField,
  licenseNumber: licenseNumberField,
  specialization: trimString('Specialization is required', 2, 80),
  customSpecialization: optionalText(80, 'Specialization is too long'),
  experience: positiveIntField('Experience', 0, 70),
  password: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
  certificate: requiredFile('Professional certificate is required'),
}).refine((data) => data.specialization !== 'Other' || !!data.customSpecialization?.trim(), {
  message: 'Please specify your specialization',
  path: ['customSpecialization'],
});

export const hospitalSignupSchema = matchingPasswordSchema({
  hospitalName: trimString('Hospital name is required', 3, 100),
  adminEmail: emailField,
  regNumber: registrationNumberField,
  facilityType: z.enum(FACILITY_TYPES, { message: 'Select a valid facility type' }),
  bedCapacity: positiveIntField('Bed capacity', 1, 100000),
  password: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
  certificate: requiredFile('Registration certificate is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const resetPasswordFormSchema = z.object({
  password: passwordField,
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const otpFormSchema = z.object({
  otp: z.string().regex(/^[0-9]{6}$/, 'Enter the full 6-digit OTP'),
});

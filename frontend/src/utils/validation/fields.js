import { z } from 'zod';
import {
  LICENSE_PATTERN,
  NAME_PATTERN,
  PHONE_PATTERN,
} from './constants';

export const trimString = (message, min = 1, max = 120) =>
  z.string()
    .trim()
    .min(min, message)
    .max(max, `Must be ${max} characters or fewer`);

export const optionalText = (max, message) =>
  z.string().trim().max(max, message).optional().or(z.literal(''));

export const nameField = trimString('Name is required', 2, 80)
  .regex(NAME_PATTERN, 'Use letters, spaces, apostrophes, hyphens, or periods only');

export const emailField = z.string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(120, 'Email is too long');

export const phoneField = z.string()
  .trim()
  .regex(PHONE_PATTERN, 'Enter a valid phone number');

export const passwordField = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be 72 characters or fewer')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character');

export const licenseNumberField = trimString('License number is required', 3, 50)
  .regex(LICENSE_PATTERN, 'License number contains unsupported characters');

export const registrationNumberField = trimString('Registration number is required', 5, 60)
  .regex(LICENSE_PATTERN, 'Registration number contains unsupported characters');

export const positiveIntField = (label, min = 1, max = 10000) =>
  z.coerce.number({
    required_error: `${label} is required`,
    invalid_type_error: `${label} must be a number`,
  })
    .int(`${label} must be a whole number`)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be ${max} or less`);



export const requiredCoordinateField = (label, min, max) =>
  z.preprocess(
    (value) => (value === null || value === undefined || value === '' ? Number.NaN : value),
    z.coerce.number().min(min, `Invalid ${label}`).max(max, `Invalid ${label}`)
  );

export const optionalCoordinateField = (label, min, max) =>
  z.preprocess(
    (value) => (value === null || value === undefined || value === '' ? undefined : value),
    z.coerce.number().min(min, `Invalid ${label}`).max(max, `Invalid ${label}`).optional()
  );

export const requiredFile = (message) =>
  z.any().refine((files) => files?.length > 0, message);

export const matchingPasswordSchema = (shape) => z.object(shape).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ['confirmPassword'] }
);

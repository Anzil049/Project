import { z } from 'zod';
import {
  emailField,
  licenseNumberField,
  nameField,
  optionalText,
  phoneField,
  positiveIntField,
  trimString,
} from './fields';

export const hospitalDoctorSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  specialization: trimString('Specialization is required', 2, 80),
  customSpecialization: optionalText(80, 'Specialization is too long'),
  maxTokens: positiveIntField('Token limit', 1, 200),
  licenseNumber: licenseNumberField,
  experience: positiveIntField('Experience', 0, 70),
  qualifications: trimString('Qualifications are required', 2, 160),
  image: z.any().optional(),
}).refine((data) => data.specialization !== 'Other' || !!data.customSpecialization?.trim(), {
  message: 'Please specify your specialization',
  path: ['customSpecialization'],
});

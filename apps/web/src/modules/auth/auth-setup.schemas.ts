import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export type EmailFormValues = z.infer<typeof emailSchema>;

export const otpSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be 6 digits'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Company name is too long'),
});
export type CreateCompanyFormValues = z.infer<typeof createCompanySchema>;

import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "Name cannot be empty")
    .max(50, "Name must be at most 50 characters"),
  birthDate: z
    .string()
    .min(1, "Date of birth is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

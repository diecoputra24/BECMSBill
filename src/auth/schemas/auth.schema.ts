import { z } from 'zod';

/** Zod schema for sign-up request validation */
export const signUpSchema = z.object({
    email: z
        .string({ error: 'Email wajib diisi' })
        .email('Format email tidak valid')
        .min(5, 'Email minimal 5 karakter')
        .max(255, 'Email maksimal 255 karakter')
        .transform((val) => val.toLowerCase().trim()),

    password: z
        .string({ error: 'Password wajib diisi' })
        .min(8, 'Password minimal 8 karakter')
        .max(128, 'Password maksimal 128 karakter')
        .regex(/[a-z]/, 'Password harus mengandung huruf kecil')
        .regex(/[A-Z]/, 'Password harus mengandung huruf besar')
        .regex(/[0-9]/, 'Password harus mengandung angka'),

    name: z
        .string({ error: 'Nama wajib diisi' })
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter')
        .trim(),

    username: z
        .string({ error: 'Username wajib diisi' })
        .min(3, 'Username minimal 3 karakter')
        .max(50, 'Username maksimal 50 karakter')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username hanya boleh huruf, angka, dan underscore')
        .transform((val) => val.toLowerCase().trim()),

    role: z
        .enum(['ADMIN', 'SUPERADMIN', 'OPERATOR'], {
            error: 'Role harus ADMIN, SUPERADMIN, atau OPERATOR',
        })
        .default('ADMIN'),
});

/** Zod schema for sign-in request validation */
export const signInSchema = z.object({
    email: z
        .string({ error: 'Email wajib diisi' })
        .email('Format email tidak valid')
        .transform((val) => val.toLowerCase().trim()),

    password: z
        .string({ error: 'Password wajib diisi' })
        .min(1, 'Password wajib diisi'),
});

/** Zod schema for change password validation */
export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string({ error: 'Password lama wajib diisi' })
            .min(1, 'Password lama wajib diisi'),

        newPassword: z
            .string({ error: 'Password baru wajib diisi' })
            .min(8, 'Password baru minimal 8 karakter')
            .max(128, 'Password baru maksimal 128 karakter')
            .regex(/[a-z]/, 'Password baru harus mengandung huruf kecil')
            .regex(/[A-Z]/, 'Password baru harus mengandung huruf besar')
            .regex(/[0-9]/, 'Password baru harus mengandung angka'),

        confirmPassword: z
            .string({ error: 'Konfirmasi password wajib diisi' }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Konfirmasi password tidak sama',
        path: ['confirmPassword'],
    });

/** Inferred types */
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

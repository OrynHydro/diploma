import { z } from 'zod'

export const registerSchema = z
    .object({
        phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Некоректний номер телефону'),
        password: z.string().min(8, 'Пароль має бути мінімум 8 символів'),
        userCode: z.string().or(z.literal('')), 
        verificationCode: z.string().or(z.literal('')),
    })
    .refine((data) => data.userCode === data.verificationCode, {
        message: 'Код не співпадає',
        path: ['userCode'], 
    })
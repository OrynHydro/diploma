import { z } from 'zod';

export const loginSchema = z.object({
  phone: z
    .string()
    .min(1, 'Номер телефону обов’язковий')
    .regex(
      /^(?:\+38)?(?:\(0\d{2}\)|0\d{2})\d{7}$/,
      'Формат: +380XXXXXXXXX'
    ),
  password: z
    .string()
    .min(8, 'Пароль має бути мінімум 8 символів')
});
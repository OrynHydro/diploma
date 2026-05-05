'use client'
import React, { FC, useState } from 'react'
import s from './Auth.module.scss'
import { useForm } from '@tanstack/react-form'
import { registerSchema } from '@/libs/schema/register.schema'
import { api } from '@/api/api'

const AuthPage: FC = () => {
    const [view, setView] = useState<'register' | 'verify'>('register')

    const form = useForm({
        defaultValues: {
            phone: '',
            password: '',
            userCode: '',
            verificationCode: ''
        },
        validators: {
            onSubmit: registerSchema
        },
        onSubmit: async ({ value }) => {
            if (view === 'register') {
                try {
                    const res = await api.post('/sms');
                    
                    form.setFieldValue('verificationCode', res.data.code.toString());
                    console.log(res.data.code.toString())
                    
                    setView('verify');
                    console.log('Код отримано та записано у форму');
                } catch (error) {
                    console.error('Помилка при відправці SMS:', error);
                }
            } else {
                if (value.userCode !== value.verificationCode) {
                    alert('Код не співпадає!');
                    return;
                }
                const { data } = await api.post('/users', {
                    phone: value.phone,
                    password: value.password
                });

                console.log('Реєстрація успішна:', data);
            }
        }
    })

    return (
        <div className={s.container}>
            <form 
                className={s.form} 
                onSubmit={(e) => {
                    e.preventDefault()
                    form.handleSubmit()
                }}
            >
                {view === 'register' ? (
                    <>
                        <h2>Реєстрація</h2>
                        <form.Field name="phone">
                            {(field) => (
                                <input
                                    className={s.input}
                                    type="tel"
                                    placeholder="Телефон"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                />
                            )}
                        </form.Field>

                        <form.Field name="password">
                            {(field) => (
                                <input
                                    className={s.input}
                                    type="password"
                                    placeholder="Пароль"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                />
                            )}
                        </form.Field>
                        
                        <button className={s.button} type="submit">Отримати код</button>
                    </>
                ) : (
                    <>
                        <h2>Введіть код</h2>
                        <form.Field name="userCode">
                            {(field) => (
                                <input
                                    className={s.input}
                                    type="text"
                                    placeholder="Код з SMS"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                />
                            )}
                        </form.Field>
                        <button className={s.button} type="submit">Підтвердити</button>
                    </>
                )}
            </form>
        </div>
    )
}

export default AuthPage
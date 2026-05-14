'use client'
import { FC, useState } from 'react'
import s from './Auth.module.scss'
import { useForm } from '@tanstack/react-form'
import { useActions } from '@/hooks/useActions'
import { loginSchema } from '@/libs/schema/login.schema'
import { registerSchema } from '@/libs/schema/register.schema'
import z from 'zod'
import { useAuthMutation } from '@/hooks/useAuthMutation'
import { toast } from 'react-hot-toast'

const AuthPage: FC = () => {
    const [view, setView] = useState<'login' | 'register' | 'verify'>('login')
    const [error, setError] = useState<string>('')
    const loginMut = useAuthMutation('login')
    const smsMut = useAuthMutation('sms')
    const registerMut = useAuthMutation('register')

    const { setUser } = useActions()

    const form = useForm({
        defaultValues: {
            phone: '',
            password: '',
            userCode: '',
            verificationCode: ''
        },
        validators: {
            onSubmit: view === 'login' 
                ? loginSchema.extend({
                    userCode: z.string(),
                    verificationCode: z.string()
                }) 
                : registerSchema
        },
        onSubmit: async ({ value }) => {
            if (view === 'login') {
                loginMut.mutate({ 
                    phone: value.phone, 
                    password: value.password 
                }, {
                    onSuccess: (data) => {
                        setUser(data.user)
                        window.location.assign('/')
                    }
                })
            } 
            
            else if (view === 'register') {
                smsMut.mutate({ phone: value.phone }, { 
                    onSuccess: (res) => {
                        console.log('SMS Code (dev):', res.code) 
                        form.setFieldValue('verificationCode', res.code.toString())
                        setView('verify')
                        toast.success('Код відправлено')
                    }
                })
            }
            
            else if (view === 'verify') {
                if (value.userCode !== value.verificationCode) {
                    setError('Код не співпадає!')
                    toast.error('Код не співпадає!')
                    return
                }

                const guestId = localStorage.getItem('guestId')
                registerMut.mutate({
                    phone: value.phone,
                    password: value.password,
                    ...(guestId && { guestId })
                }, {
                    onSuccess: (data) => {
                        if (guestId) localStorage.removeItem('guestId')
                        setUser(data.user)
                        window.location.assign('/')
                    }
                })
            }
        }
    })

    return (
        <div className={s.container}>
            <div className={s.card}>
                <div className={s.tabs}>
                    <button 
                        className={view === 'login' ? s.activeTab : ''} 
                        onClick={() => { setView('login'); setError(''); }}
                        disabled={view === 'verify'}
                    >
                        Увійти
                    </button>
                    <button 
                        className={(view === 'register' || view === 'verify') ? s.activeTab : ''} 
                        onClick={() => { setView('register'); setError(''); }}
                        disabled={view === 'verify'}
                    >
                        Реєстрація
                    </button>
                </div>

                <form 
                    className={s.form} 
                    onSubmit={(e) => {
                        e.preventDefault()
                        form.handleSubmit()
                    }}
                >
                    <h2>
                        {view === 'login' && 'З поверненням!'}
                        {view === 'register' && 'Створити аккаунт'}
                        {view === 'verify' && 'Перевірка SMS'}
                    </h2>

                    {error && view !== 'verify' && <div className={s.errorMessage}>{error}</div>}

                    {view !== 'verify' ? (
                        <>
                            <form.Field name="phone">
                                {(field) => (
                                    <div className={s.field}>
                                        <label>Телефон</label>
                                        <input
                                            className={`${s.input} ${field.state.meta.errors.length ? s.inputError : ''}`}
                                            type="tel"
                                            placeholder="+380..."
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <span className={s.errorHint}>
                                                {(field.state.meta.errors[0] as { message?: string })?.message ?? String(field.state.meta.errors[0])}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="password">
                                {(field) => (
                                    <div className={s.field}>
                                        <label>Пароль</label>
                                        <input
                                            className={`${s.input} ${field.state.meta.errors.length ? s.inputError : ''}`}
                                            type="password"
                                            placeholder="••••••••"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            onBlur={field.handleBlur}
                                        />
                                        {field.state.meta.errors.length > 0 && (
                                            <span className={s.errorHint}>
                                                {(field.state.meta.errors[0] as { message?: string })?.message ?? String(field.state.meta.errors[0])}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </form.Field>

                            <button className={s.button} type="submit">
                                {view === 'login' ? 'Увійти' : 'Отримати код'}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className={s.info}>Ми відправили код на ваш номер</p>
                            <form.Field name="userCode">
                                {(field) => (
                                    <div className={s.field}>
                                        <input
                                            className={`${s.input} ${field.state.meta.errors.length || error ? s.inputError : ''}`}
                                            type="text"
                                            placeholder="000000"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            autoFocus
                                        />
                                        {(field.state.meta.errors.length > 0 || error) && (
                                            <span className={s.errorHint}>
                                                {field.state.meta.errors.length > 0 
                                                    ? (field.state.meta.errors[0] as { message?: string })?.message 
                                                    : error}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </form.Field>
                            <button className={s.button} type="submit">Підтвердити</button>
                            <button 
                                className={s.backBtn} 
                                type="button"
                                onClick={() => { setView('register'); setError(''); }}
                            >
                                Назад
                            </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    )
}

export default AuthPage
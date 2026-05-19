'use client'
import React, { FC } from 'react'
import { useForm } from '@tanstack/react-form'

import s from './ProfileEdit.module.scss'
import { IUser } from '@shared/interfaces/user.interface'
import useUpdateProfile from '@/hooks/useUpdateProfile'

interface ProfileEditFormProps {
    user: IUser
}

const ProfileEditForm: FC<ProfileEditFormProps> = ({ user }) => {
    const { mutate, isPending } = useUpdateProfile()

    const form = useForm({
        defaultValues: {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
        },
        onSubmit: async ({ value }) => {
            mutate({
                firstName: value.firstName,
                lastName: value.lastName,
                email: value.email
            })
        },
    })

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
            }}
            className={s.form}
        >
                {/* Поле Имени */}
                <form.Field 
                    name="firstName"
                    validators={{
                        onChange: ({ value }) => !value ? "Ім'я обов'язкове" : undefined
                    }}
                >
                    {(field) => (
                        <div className={s.field}>
                            <label>Ім`я</label>
                            <input
                                className={`${s.input} ${field.state.meta.errors.length ? s.inputError : ''}`}
                                placeholder="Іван"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                disabled={isPending}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <span className={s.errorMsg}>{field.state.meta.errors.join(', ')}</span>
                            )}
                        </div>
                    )}
                </form.Field>

                <form.Field 
                    name="lastName"
                    validators={{
                        onChange: ({ value }) => !value ? "Прізвище обов'язкове" : undefined
                    }}
                >
                    {(field) => (
                        <div className={s.field}>
                            <label>Прізвище</label>
                            <input
                                className={`${s.input} ${field.state.meta.errors.length ? s.inputError : ''}`}
                                placeholder="Іванов"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                disabled={isPending}
                            />
                            {field.state.meta.errors.length > 0 && (
                                <span className={s.errorMsg}>{field.state.meta.errors.join(', ')}</span>
                            )}
                        </div>
                    )}
                </form.Field>

            <form.Field name="email">
                {(field) => (
                    <div className={s.field}>
                        <label>Email</label>
                        <input
                            className={s.input}
                            type="email"
                            placeholder="example@email.com"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isPending}
                        />
                    </div>
                )}
            </form.Field>

            <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
                {([canSubmit, isSubmitting]) => (
                    <button 
                        type="submit" 
                        className={s.submitBtn} 
                        disabled={!canSubmit || isPending || isSubmitting}
                    >
                        {isPending || isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
                    </button>
                )}
            </form.Subscribe>
        </form>
    )
}

export default ProfileEditForm
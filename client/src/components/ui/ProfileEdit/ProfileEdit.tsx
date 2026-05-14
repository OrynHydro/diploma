'use client'
import React, { FC } from 'react'
import { useForm } from '@tanstack/react-form'

import s from './ProfileEdit.module.scss'
import { IUser } from '@shared/interfaces/user.interface'
import  useUpdateProfile  from '@/hooks/useUpdateProfile'

interface ProfileEditFormProps {
    user: IUser
}

const ProfileEditForm: FC<ProfileEditFormProps> = ({ user }) => {
    const { mutate, isPending } = useUpdateProfile()

    const form = useForm({
        defaultValues: {
            name: user.name || '',
            email: user.email || '',
        },
        onSubmit: async ({ value }) => {
            mutate(value)
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
            {/* Поле імені */}
            <form.Field 
                name="name"
                validators={{
                    onChange: ({ value }) => !value ? "Ім'я обов'язкове" : undefined
                }}
            >
                {(field) => (
                    <div className={s.field}>
                        <label>Імя</label>
                        <input
                            className={`${s.input} ${field.state.meta.errors.length ? s.inputError : ''}`}
                            placeholder="Введіть ваше ім'я"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            onBlur={field.handleBlur}
                            disabled={isPending}
                        />
                        {field.state.meta.errors.length > 0 && (
                            <span className={s.errorHint}>
                                {(field.state.meta.errors[0] as { message?: string })?.message ?? String(field.state.meta.errors[0])}
                            </span>
                        )}
                    </div>
                )}
            </form.Field>

            {/* Поле Email (необов'язкове) */}
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


            {/* Кнопка відправки з підпискою на стан */}
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
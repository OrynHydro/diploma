import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/api'
import { AxiosError } from 'axios'
import { toast } from 'react-hot-toast'
import { IUser } from '@shared/interfaces/user.interface'

interface IAuthData {
    phone?: string
    password?: string
    guestId?: string
}
interface IAuthResponse {
    user: IUser | null
    code: number
    message?: string
}

export const useAuthMutation = (mode: 'login' | 'sms' | 'register') => {
    return useMutation<IAuthResponse, AxiosError<{ message: string }>, IAuthData>({
        mutationKey: ['auth', mode],
        mutationFn: async (data: IAuthData) => {
            const endpoints = {
                login: '/users/login',
                sms: '/sms', 
                register: '/users' 
            }
            const response = await api.post(endpoints[mode], data)
            return response.data
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'Сталася помилка'
            toast.error(msg)
        }
    })
}
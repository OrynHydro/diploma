import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/api'
import { IUser } from '@shared/interfaces/user.interface'
import { toast } from 'react-hot-toast'
import { AxiosError } from 'axios' 

interface IErrorResponse {
    message: string
}

const useUpdateProfile = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationKey: ['update profile'],
        mutationFn: (data: Partial<IUser>) => api.put('/users/profile', data),
        onSuccess: () => {
            toast.success('Профіль оновлено!')
            queryClient.invalidateQueries({ queryKey: ['profile'] })
        },
        onError: (error: AxiosError<IErrorResponse>) => {
            toast.error(error.response?.data?.message || 'Помилка при оновленні')
        }
    })
}

export default useUpdateProfile;
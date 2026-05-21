import { useTypedSelector } from './useTypedSelector'

export const useAuth = () => {
    const { user, isAuth, isLoading, isAdmin } = useTypedSelector(state => state.user)

    return {
        user,    
        isAuth,  
        isLoading,
        isAdmin
    }
}
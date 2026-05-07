import { useTypedSelector } from './useTypedSelector'

export const useAuth = () => {
    const { user, isAuth, isLoading } = useTypedSelector(state => state.user)

    return {
        user,    
        isAuth,  
        isLoading 
    }
}
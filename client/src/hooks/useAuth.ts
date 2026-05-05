import { useTypedSelector } from './useTypedSelector'
import { IUser } from '@shared/interfaces/user.interface'

interface UseAuthReturn {
	user?: IUser | null
}

export const useAuth = (): UseAuthReturn => {
	const { data } = useTypedSelector(state => state.user)

	return {
		user: data,
	}
}

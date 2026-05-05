'use client'
import { FC, PropsWithChildren} from 'react'
import { IUser } from '@shared/interfaces/user.interface'
import axios from 'axios'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import s from './AuthProvider.module.scss'

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
	
	return <>{children}</>
}

export const RootProvider: FC<PropsWithChildren> = ({ children }) => {
	return (
		<Provider store={store}>
			<AuthProvider>{children}</AuthProvider>
		</Provider>
	)
}

import { PayloadAction } from './../../../node_modules/@reduxjs/toolkit/src/createAction'
import { createSlice } from '@reduxjs/toolkit'
import {IUser} from '@shared/interfaces/user.interface'

interface UserInitialState {
    user: IUser | null
    isAuth: boolean
    isLoading: boolean
}

const initialState: UserInitialState = {
    user: null,
    isAuth: false,
    isLoading: true, 
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        // Установка пользователя (и гостя, и обычного)
        setUser: (state, action: PayloadAction<IUser | null>) => {
            state.user = action.payload
            state.isAuth = !!action.payload && !action.payload.isGuest
            state.isLoading = false
        },
        
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload
        },

        logout: (state) => {
            state.user = null
            state.isAuth = false
            state.isLoading = false
        }
    },
})

export const { setUser, setLoading, logout } = userSlice.actions

export default userSlice.reducer

import { configureStore } from '@reduxjs/toolkit'
import userReducer from './user/userSlice'
import chatReducer from './chat/chatSlice'
import cartReducer from './cart/cartSlice'

export const store = configureStore({
	reducer: {
		user: userReducer,
		chat: chatReducer,
		cart: cartReducer,
	},
	devTools: process.env.NODE_ENV !== 'production',
})

export type RootState = ReturnType<typeof store.getState>

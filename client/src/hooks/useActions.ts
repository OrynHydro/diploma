import { useDispatch } from 'react-redux'
import { userSlice } from '@/store/user/userSlice'
import { useMemo } from 'react'
import { bindActionCreators } from '@reduxjs/toolkit'
import { chatSlice } from '@/store/chat/chatSlice'
import { cartSlice } from '@/store/cart/cartSlice'

const rootActions = {
	...userSlice.actions,
	...chatSlice.actions,
	...cartSlice.actions
}

export const useActions = () => {
	const dispatch = useDispatch()

	return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}

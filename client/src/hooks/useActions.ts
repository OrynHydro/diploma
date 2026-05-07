import { useDispatch } from 'react-redux'
import { userSlice } from '@/store/user/userSlice'
import { useMemo } from 'react'
import { bindActionCreators } from '@reduxjs/toolkit'
import { chatSlice } from '@/store/chat/chatSlice'

const rootActions = {
	...userSlice.actions,
	...chatSlice.actions
}

export const useActions = () => {
	const dispatch = useDispatch()

	return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}

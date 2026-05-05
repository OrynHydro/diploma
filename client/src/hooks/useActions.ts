import { useDispatch } from 'react-redux'
import { userSlice } from '@/store/user/userSlice'
import { useMemo } from 'react'
import { bindActionCreators } from '@reduxjs/toolkit'

const rootActions = {
	...userSlice.actions,
}

export const useActions = () => {
	const dispatch = useDispatch()

	return useMemo(() => bindActionCreators(rootActions, dispatch), [dispatch])
}

'use client'
import { FC, PropsWithChildren, useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from '@/store/store'
import { useActions } from '@/hooks/useActions'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/api'
import s from './AuthProvider.module.scss'

const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const { setUser, setLoading, setMessages } = useActions()
    const { isLoading } = useAuth()

    useEffect(() => {
        const initSession = async () => {
            setLoading(true)
            try {
                const { data: userData } = await api.get('/users/get-by-token')
                
                setUser({
                    ...userData,
                    isGuest: false
                })

                const { data: chatData } = await api.get('/chats')
				setMessages(Array.isArray(chatData) ? chatData : (chatData.messages || []))

            } catch (error) {
                let guestId = localStorage.getItem('guestId')
                
                if (!guestId) {
                    guestId = crypto.randomUUID()
                    localStorage.setItem('guestId', guestId)
                }

                setUser({
                    guestId,
                    isGuest: true
                })

                try {
                    const { data: guestChatData } = await api.get('/chats', { 
						params: { guestId } 
					})
					setMessages(Array.isArray(guestChatData) ? guestChatData : (guestChatData.messages || []))
                } catch (chatError) {
                    setMessages([])
                }
            } finally {
                setLoading(false)
            }
        }

        initSession()
    }, [setUser, setLoading, setMessages])

    if (isLoading) {
        return (
            <div>
                    Синхронізація...
                </div>
        )
    }

    return <>{children}</>
}

export const RootProvider: FC<PropsWithChildren> = ({ children }) => {
    return (
        <Provider store={store}>
            <AuthProvider>{children}</AuthProvider>
        </Provider>
    )
}
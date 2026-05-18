import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { api } from '@/api/api'

export const useSearch = () => {
    const [searchTerm, setSearchTerm] = useState('')
    const [debouncedTerm, setDebouncedTerm] = useState('')

    useEffect(() => {
        if (!searchTerm.trim()) return

        const handler = setTimeout(() => {
            setDebouncedTerm(searchTerm)
        }, 450)

        return () => clearTimeout(handler)
    }, [searchTerm])

    // Функція для зміни тексту, яку ми віддамо в Header.tsx
    const handleInputChange = (value: string) => {
        setSearchTerm(value)
        if (!value.trim()) {
            setDebouncedTerm('') // Абсолютно легальний setState в події кліку/введення!
        }
    }

    const { data: results = [], isPending } = useQuery({
        queryKey: ['search products', debouncedTerm],
        queryFn: async () => {
            const { data } = await api.get(`/products/standart-search?q=${encodeURIComponent(debouncedTerm)}`)
            return data
        },
        enabled: debouncedTerm.trim().length > 0,
        refetchOnWindowFocus: false 
    })

    // Визначаємо, чи крутити лоадер
    const isSearching = searchTerm.trim() !== debouncedTerm.trim() || isPending

    return {
        searchTerm,
        setSearchTerm: handleInputChange,
        // Якщо користувач очистив інпут, ми миттєво віддаємо порожній масив на фронт,
        // не чекаючи, поки відпрацює дебаунс в ефекті
        results: searchTerm.trim() ? results : [], 
        isPending: searchTerm.trim() ? isSearching : false
    }
}
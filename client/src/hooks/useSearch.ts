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

    const handleInputChange = (value: string) => {
        setSearchTerm(value)
        if (!value.trim()) {
            setDebouncedTerm('')
        }
    }

    const { data: results = [], isPending } = useQuery({
        queryKey: ['search products', debouncedTerm],
        queryFn: async () => {
            const { data } = await api.get(`/products?search=${encodeURIComponent(debouncedTerm)}`)
            return data
        },
        enabled: debouncedTerm.trim().length > 0,
        refetchOnWindowFocus: false 
    })

    const isSearching = searchTerm.trim() !== debouncedTerm.trim() || isPending

    return {
        searchTerm,
        setSearchTerm: handleInputChange,
        results: searchTerm.trim() ? results : [], 
        isPending: searchTerm.trim() ? isSearching : false
    }
}
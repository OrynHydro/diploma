import { useState, useEffect } from 'react';

export const useRecentlyViewed = (currentProductId: string) => {
    const [viewed, setViewed] = useState<string[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!currentProductId) return;

            const saved = localStorage.getItem('recentlyViewed');
            const list: string[] = saved ? JSON.parse(saved) : [];

            const filteredList = list.filter(id => id !== currentProductId);
            const updatedList = [currentProductId, ...filteredList].slice(0, 9);

            localStorage.setItem('recentlyViewed', JSON.stringify(updatedList));
            setViewed(updatedList);
        }, 0);

        return () => clearTimeout(timer);
    }, [currentProductId]);

    return viewed;
};
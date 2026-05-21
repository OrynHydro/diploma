'use client';

import React, { FC, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { IProduct } from '@shared/interfaces/product.interface';
import { api } from '@/api/api';
import ProductItem from '@/components/ui/ProductItem/ProductItem';
import s from './Catalogue.module.scss';
import { specTranslations } from '@/helpers/specsTranslation';
import { categoryMap } from '@/helpers/categories';

const categories = Object.keys(categoryMap);

const CataloguePage: FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const searchQuery = searchParams.get('search') || '';
    const activeCategory = searchParams.get('cat') || 'All';

    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
    const [sortBy, setSortBy] = useState<string>('default');

    const { data: products = [], isPending } = useQuery({
        queryKey: ['products', activeCategory, searchQuery],
        queryFn: () => api.get(`/products`, { 
            params: { 
                cat: activeCategory !== 'All' ? activeCategory : undefined,
                search: searchQuery 
            } 
        }).then(res => res.data),
    });

    const searchedAndCategoryProducts = useMemo(() => {
        if (!products || !Array.isArray(products)) return [];
        
        let result = [...products];

        if (searchQuery.trim()) {
            const cleanSearch = searchQuery.toLowerCase().trim();
            result = result.filter((p: IProduct) => 
                p.name.toLowerCase().includes(cleanSearch) || 
                p.brand?.toLowerCase().includes(cleanSearch)
            );
        }

        if (activeCategory !== 'All') {
            result = result.filter((p: IProduct) => p.category === activeCategory);
        }

        return result;
    }, [products, searchQuery, activeCategory]);

    const uniqueBrands = useMemo(() => {
        const brands = searchedAndCategoryProducts.map((p: IProduct) => p.brand).filter(Boolean);
        return Array.from(new Set(brands)) as string[];
    }, [searchedAndCategoryProducts]);

    const availableSpecs = useMemo(() => {
        const specsMap: Record<string, Set<string>> = {};
        searchedAndCategoryProducts.forEach((p: IProduct) => {
            if (p.specs) {
                Object.entries(p.specs).forEach(([key, value]) => {
                    if (value) {
                        if (!specsMap[key]) specsMap[key] = new Set();
                        specsMap[key].add(String(value));
                    }
                });
            }
        });
        const result: Record<string, string[]> = {};
        Object.entries(specsMap).forEach(([key, valueSet]) => result[key] = Array.from(valueSet));
        return result;
    }, [searchedAndCategoryProducts]);

    const filteredProducts = useMemo(() => {
        let result = [...searchedAndCategoryProducts];

        if (minPrice) result = result.filter(p => p.price >= Number(minPrice));
        if (maxPrice) result = result.filter(p => p.price <= Number(maxPrice));
        if (selectedBrands.length > 0) result = result.filter(p => p.brand && selectedBrands.includes(p.brand));
        
        if (Object.keys(selectedSpecs).length > 0) {
            result = result.filter(product => {
                return Object.entries(selectedSpecs).every(([specKey, selectedValues]) => {
                    const productSpecValue = product.specs?.[specKey];
                    return productSpecValue && selectedValues.includes(String(productSpecValue));
                });
            });
        }

        if (sortBy === 'price_asc') result.sort((a, b) => a.price - b.price);
        if (sortBy === 'price_desc') result.sort((a, b) => b.price - a.price);
        if (sortBy === 'rating_desc') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        return result;
    }, [searchedAndCategoryProducts, minPrice, maxPrice, selectedBrands, selectedSpecs, sortBy]);

    const handleBrandChange = (brand: string) => {
        setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    };

    const handleSpecChange = (specKey: string, value: string) => {
        setSelectedSpecs(prev => {
            const currentValues = prev[specKey] || [];
            const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
            const updated = { ...prev, [specKey]: newValues };
            if (newValues.length === 0) delete updated[specKey];
            return updated;
        });
    };

    return (
        <div className={s.container}>
            <aside className={s.sidebar}>
                <div className={s.filterSection}>
                    <h3>Категорії</h3>
                    <ul className={s.categoryList}>
                        {categories.map(cat => (
                            <li key={cat} className={activeCategory === cat ? s.active : ''} 
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString());
                                    if (cat === 'All') {
                                        params.delete('cat');
                                    } else {
                                        params.set('cat', cat);
                                    }
                                    
                                    router.push(`/catalogue?${params.toString()}`);
                                }}>
                                {categoryMap[cat as keyof typeof categoryMap]}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={s.filterSection}>
                    <h3>Ціна, $</h3>
                    <div className={s.priceInputs}>
                        <input type="number" placeholder="Від" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                        <input type="number" placeholder="До" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                    </div>
                </div>

                {uniqueBrands.length > 0 && (
                    <div className={s.filterSection}>
                        <h3>Бренди</h3>
                        <div className={s.brandList}>
                            {uniqueBrands.map(brand => (
                                <label key={brand} className={s.brandLabel}>
                                    <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => handleBrandChange(brand)} />
                                    <span>{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {Object.entries(availableSpecs).map(([specKey, values]) => (
                    <div key={specKey} className={s.filterSection}>
                        <h3>{specTranslations[specKey] || specKey}</h3>
                        <div className={s.brandList}>
                            {values.map(val => (
                                <label key={val} className={s.brandLabel}>
                                    <input type="checkbox" checked={selectedSpecs[specKey]?.includes(val) || false} onChange={() => handleSpecChange(specKey, val)} />
                                    <span>{val}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
            </aside>

            <main className={s.main}>
                <header className={s.header}>
                    <h1>{searchQuery ? `Пошук: "${searchQuery}"` : 'Каталог'}</h1>
                    <div className={s.catalogMeta}>
                        <p>Знайдено: {filteredProducts.length}</p>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="default">За замовчуванням</option>
                            <option value="price_asc">Від дешевих до дорогих</option>
                            <option value="price_desc">Від дорогих до дорогих</option>
                            <option value="rating_desc">За рейтингом</option>
                        </select>
                    </div>
                </header>

                {isPending ? (
                    <div className={s.loader}>
                        <div className={s.spinner}></div>
                    </div>
                ) : filteredProducts.length > 0 ? (
                    <div className={s.grid}>
                        {filteredProducts.map(p => <ProductItem key={p._id} product={p} />)}
                    </div>
                ) : (
                    <div className={s.empty}>
                        <h3>Товарів не знайдено</h3>
                        <p>Спробуйте змінити фільтри або пошуковий запит.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CataloguePage;
'use client';

import React, { FC, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { IProduct } from '@shared/interfaces/product.interface';
import { api } from '@/api/api';
import ProductItem from '@/components/ui/ProductItem/ProductItem';
import s from './Catalogue.module.scss';
import { specTranslations } from '@/helpers/specsTranslation';

const categoryMap: Record<string, string> = {
    'All': 'Всі товари',
    'Laptops': 'Ноутбуки',
    'Monitors': 'Монітори',
    'Audio': 'Аудіо',
    'Components': 'Комплектуючі',
    'Networking': 'Мережеве обладнання',
    'Gaming': 'Геймінг',
    'Smartphones': 'Смартфони'
};

const categories = Object.keys(categoryMap);

const CataloguePage: FC = () => {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

    const [activeCategory, setActiveCategory] = useState('All');
    const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

    const [minPrice, setMinPrice] = useState<string>('');
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
    
    // Новий стейт для типу сортування
    const [sortBy, setSortBy] = useState<string>('default');

    // Синхронне скидання при зміні пошукового запиту в хедері
    if (searchQuery !== prevSearchQuery) {
        setPrevSearchQuery(searchQuery);
        setActiveCategory('All'); 
        setSelectedBrands([]);
        setSelectedSpecs({});
        setSortBy('default');
    }

    const { data: products = [], isPending } = useQuery<IProduct[]>({
        queryKey: ['catalogue products'],
        queryFn: async () => {
            const res = await api.get('/products');
            return res.data;
        }
    });

    const searchedAndCategoryProducts = useMemo(() => {
        let result = products;

        if (searchQuery.trim()) {
            const cleanSearch = searchQuery.toLowerCase().trim();
            result = result.filter(p => 
                p.name.toLowerCase().includes(cleanSearch) || 
                p.brand?.toLowerCase().includes(cleanSearch)
            );
        }

        if (activeCategory !== 'All') {
            result = result.filter(p => p.category === activeCategory);
        }

        return result;
    }, [products, searchQuery, activeCategory]);

    const uniqueBrands = useMemo(() => {
        const brands = searchedAndCategoryProducts.map(p => p.brand).filter(Boolean) as string[];
        return Array.from(new Set(brands));
    }, [searchedAndCategoryProducts]);

    const availableSpecs = useMemo(() => {
        if (activeCategory === 'All' && !searchQuery.trim()) return {};

        const specsMap: Record<string, Set<string>> = {};

        searchedAndCategoryProducts.forEach(product => {
            if (product.specs) {
                Object.entries(product.specs).forEach(([key, value]) => {
                    if (value) {
                        if (!specsMap[key]) {
                            specsMap[key] = new Set();
                        }
                        specsMap[key].add(String(value));
                    }
                });
            }
        });

        const result: Record<string, string[]> = {};
        Object.entries(specsMap).forEach(([key, valueSet]) => {
            result[key] = Array.from(valueSet);
        });

        return result;
    }, [searchedAndCategoryProducts, activeCategory, searchQuery]);


    // КІНЦЕВИЙ МАСИВ ДЛЯ РЕНДЕРУ (фільтрує + сортує на фіналі)
    const filteredProducts = useMemo(() => {
        let result = [...searchedAndCategoryProducts]; // Робимо копію, щоб .sort() не мутував базовий масив

        // Фільтр по ціні
        if (minPrice) result = result.filter(p => p.price >= Number(minPrice));
        if (maxPrice) result = result.filter(p => p.price <= Number(maxPrice));

        // Фільтр по обраних брендах
        if (selectedBrands.length > 0) {
            result = result.filter(p => p.brand && selectedBrands.includes(p.brand));
        }

        // Фільтр по характеристиках
        if (Object.keys(selectedSpecs).length > 0) {
            result = result.filter(product => {
                return Object.entries(selectedSpecs).every(([specKey, selectedValues]) => {
                    const productSpecValue = product.specs?.[specKey];
                    return productSpecValue && selectedValues.includes(String(productSpecValue));
                });
            });
        }

        // НАКЛАДАЄМО СОРТУВАННЯ
        if (sortBy === 'price_asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price_desc') {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'rating_desc') {
            result.sort((a, b) => b.rating - a.rating);
        }

        return result;
    }, [searchedAndCategoryProducts, minPrice, maxPrice, selectedBrands, selectedSpecs, sortBy]);

    const handleBrandChange = (brand: string) => {
        setSelectedBrands(prev => 
            prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
        );
    };

    const handleSpecChange = (specKey: string, value: string) => {
        setSelectedSpecs(prev => {
            const currentValues = prev[specKey] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            const updated = { ...prev, [specKey]: newValues };
            
            if (newValues.length === 0) {
                delete updated[specKey];
            }
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
                            <li 
                                key={cat} 
                                className={activeCategory === cat ? s.active : ''}
                                onClick={() => {
                                    setActiveCategory(cat);
                                    setSelectedBrands([]); 
                                    setSelectedSpecs({});  
                                    setSortBy('default'); // Скидаємо сортування на дефолт при зміні категорії
                                }}
                            >
                                {categoryMap[cat]}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className={s.filterSection}>
                    <h3>Ціна, $</h3>
                    <div className={s.priceInputs}>
                        <input 
                            type="number" 
                            placeholder="Від" 
                            value={minPrice} 
                            onChange={(e) => setMinPrice(e.target.value)} 
                        />
                        <input 
                            type="number" 
                            placeholder="До" 
                            value={maxPrice} 
                            onChange={(e) => setMaxPrice(e.target.value)} 
                        />
                    </div>
                </div>

                {uniqueBrands.length > 0 && (
                    <div className={s.filterSection}>
                        <h3>Бренди</h3>
                        <div className={s.brandList}>
                            {uniqueBrands.map(brand => (
                                <label key={brand} className={s.brandLabel}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedBrands.includes(brand)} 
                                        onChange={() => handleBrandChange(brand)} 
                                    />
                                    <span>{brand}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {Object.entries(availableSpecs).map(([specKey, values]) => {
                    const labelTitle = specTranslations[specKey] || specKey;

                    return (
                        <div key={specKey} className={s.filterSection}>
                            <h3>{labelTitle}</h3>
                            <div className={s.brandList}>
                                {values.map(val => (
                                    <label key={val} className={s.brandLabel}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedSpecs[specKey]?.includes(val) || false} 
                                            onChange={() => handleSpecChange(specKey, val)} 
                                        />
                                        <span>{val}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    );
                })}
                
                {(minPrice || maxPrice || selectedBrands.length > 0 || Object.keys(selectedSpecs).length > 0 || activeCategory !== 'All' || sortBy !== 'default') && (
                    <button 
                        className={s.resetBtn}
                        onClick={() => {
                            setMinPrice('');
                            setMaxPrice('');
                            setSelectedBrands([]);
                            setSelectedSpecs({});
                            setActiveCategory('All');
                            setSortBy('default');
                        }}
                    >
                        Скинути фільтри
                    </button>
                )}
            </aside>

            <main className={s.main}>
                <header className={s.header}>
                    <h1>
                        {searchQuery ? `Пошук за запитом: "${searchQuery}"` : 'Каталог техніки'}
                    </h1>
                    
                    <div className={s.catalogMeta}>
                        <p>Знайдено товарів: {filteredProducts.length}</p>
                        
                        <div className={s.sortBlock}>
                            <span>Сортувати:</span>
                            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="default">За замовчуванням</option>
                                <option value="price_asc">Від дешевих до дорогих</option>
                                <option value="price_desc">Від дорогих до дешевих</option>
                                <option value="rating_desc">За рейтингом та відгуками</option>
                            </select>
                        </div>
                    </div>
                </header>

                {isPending ? (
                    <div className={s.loader}>Завантаження каталогу...</div>
                ) : (
                    <>
                        {filteredProducts.length > 0 ? (
                            <div className={s.grid}>
                                {filteredProducts.map(product => (
                                    <ProductItem key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className={s.empty}>
                                <h3>Нічого не знайдено за вашим запитом</h3>
                                <p>Спробуйте змінити категорію або ключові слова.</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default CataloguePage;
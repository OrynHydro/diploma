'use client'
import React, { FC, useEffect, useMemo, useState } from 'react';
import { IProduct } from '@shared/interfaces/product.interface'; // Шлях до твого інтерфейсу
import s from './Catalogue.module.scss';
import Image from 'next/image';
import { api } from '@/api/api';
import Link from 'next/link';

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
    const [products, setProducts] = useState<IProduct[]>([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = useMemo(() => {
        if (activeCategory === 'All') return products;
        return products.filter(p => p.category === activeCategory);
    }, [activeCategory, products]);

    return (
        <div className={s.container}>
            <aside className={s.sidebar}>
                <h3>Категорії</h3>
                <ul className={s.categoryList}>
                    {categories.map(cat => (
                        <li 
                            key={cat} 
                            className={activeCategory === cat ? s.active : ''}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {categoryMap[cat]}
                        </li>
                    ))}
                </ul>
            </aside>

            <main className={s.main}>
                <header className={s.header}>
                    <h1>Каталог техніки</h1>
                    <p>Знайдено товарів: {filteredProducts.length}</p>
                </header>

                {loading ? (
                    <div className={s.loader}>Завантаження...</div>
                ) : (
                    <div className={s.grid}>
                        {filteredProducts.map(product => (
                            <Link href={`/product/${product._id}`} key={product.name} className={s.card}>
                                <div className={s.imageWrapper}>
                                    <Image 
                                        src={product.image} 
                                        alt={product.name} 
                                        width={200}  
                                        height={200}   
                                        className={s.productImg} 
                                        style={{ objectFit: 'contain' }} 
                                    />
                                    {product.discount > 0 && (
                                        <span className={s.badge}>-{product.discount}%</span>
                                    )}
                                </div>
                                <div className={s.info}>
                                    <span className={s.brand}>{product.brand}</span>
                                    <h2 className={s.name}>{product.name}</h2>
                                    <p className={s.price}>${product.price}</p>
                                    <button className={s.addBtn}>У кошик</button>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default CataloguePage;
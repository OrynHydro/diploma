'use client'
import React, { useEffect, useState } from 'react';
import { api } from '@/api/api';
import { IProduct } from '@shared/interfaces/product.interface';
import { ProductSlider } from '@/components/ui/ProductSlider/ProductSlider';
import s from './Home.module.scss';
import Link from 'next/link';
import { categoryMap } from '@/helpers/categories';

const HomePage = () => {
    const [popular, setPopular] = useState<IProduct[]>([]);
    const [newArrivals, setNewArrivals] = useState<IProduct[]>([]);
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const { data: popularRes } = await api.get('/products?sort=popular&limit=8');
                const { data: newRes } = await api.get('/products?sort=newest&limit=8');
                setPopular(popularRes);
                setNewArrivals(newRes);
            } catch (e) {
                console.error("Помилка завантаження даних:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className={s.homeWrapper}>
            <section className={s.hero}>
                <div className={s.heroContent}>
                    <h1>Технології майбутнього вже сьогодні</h1>
                    <p>Знайдіть найкращий товар за допомогою нашого AI-пошуку.</p>
                    <Link href="/catalogue" className={s.heroBtn}>Перейти до каталогу</Link>
                </div>
            </section>

            <section className={s.categories}>
                {Object.entries(categoryMap).map(([key, label]) => {
                    return (
                        <Link 
                            key={key} 
                            href={`/catalogue?cat=${key}`} 
                            className={s.catItem}
                        >
                            {label}
                        </Link>
                    );
                })}
            </section>

            <ProductSlider title="Популярні товари" products={popular} isLoading={loading} />
            <ProductSlider title="Новинки" products={newArrivals} isLoading={loading} />
        </div>
    );
};

export default HomePage;
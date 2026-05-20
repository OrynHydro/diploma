'use client';

import React, { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/api';
import ProductItem from '@/components/ui/ProductItem/ProductItem';
import s from './../Catalogue/Catalogue.module.scss';
import { IProduct } from '@shared/interfaces/product.interface';

const DiscountPage: FC = () => {
    const { data: products = [], isPending } = useQuery({
        queryKey: ['discount-products'],
        queryFn: () => api.get(`/products`).then(res => res.data),
    });

    const discountProducts = products.filter((p: IProduct) => p.discount > 0);

    return (
        <div className={s.container}>
            <main className={s.main}>
                <header className={s.header}>
                    <h1>🔥 Гарячі пропозиції</h1>
                    <div className={s.catalogMeta}>
                        <p>Знайдено товарів зі знижкою: {discountProducts.length}</p>
                    </div>
                </header>

                {isPending ? (
                    <div className={s.loader}>
                        <div className={s.spinner}></div>
                    </div>
                ) : discountProducts.length > 0 ? (
                    <div className={s.grid}>
                        {discountProducts.map((p: IProduct) => (
                            <ProductItem key={p._id} product={p} />
                        ))}
                    </div>
                ) : (
                    <div className={s.empty}>
                        <h3>Акційних товарів наразі немає</h3>
                        <p>Слідкуйте за оновленнями, скоро з`являться нові знижки!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default DiscountPage;
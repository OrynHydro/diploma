'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/api/api';
import { IProduct } from '@shared/interfaces/product.interface';
import s from './Product.module.scss';
import { specTranslations } from '@/helpers/specsTranslation';

const ProductPage = () => {
    const params = useParams();
    const productId = params['product-id'];
    const [product, setProduct] = useState<IProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get(`/products/${productId}`);
                setProduct(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProduct();
    }, [productId]);

    if (loading) return <div className={s.loader}>Загрузка...</div>;
    if (!product) return <div className={s.error}>Товар не найден</div>;

    return (
        <div className={s.wrapper}>
            <div className={s.container}>
                <div className={s.imageSection}>
                    <div className={`${s.imageCard} ${!isImageLoaded ? s.loading : ''}`}>
                        <Image 
                            src={product.image} 
                            alt={product.name} 
                            fill
                            priority 
                            className={`${s.mainImg} ${isImageLoaded ? s.loaded : ''}`}
                            onLoad={() => setIsImageLoaded(true)}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
                        />
                    </div>
                </div>

                <div className={s.infoSection}>
                    <div className={s.headerInfo}>
                        <span className={s.brandTag}>{product.brand}</span>
                        <h1 className={s.title}>{product.name}</h1>
                        <div className={s.priceBlock}>
                            <span className={s.price}>${product.price}</span>
                            {product.discount > 0 && (
                                <span className={s.oldPrice}>${Math.round(product.price * 1.15)}</span>
                            )}
                        </div>
                    </div>

                    <p className={s.description}>{product.description}</p>

                    <button className={s.buyBtn}>У кошик</button>

                    <div className={s.specsBlock}>
                        <h3>Технічні характеристики</h3>
                        <div className={s.specsGrid}>
                            {Object.entries(product.specs).map(([key, value]) => (
                                <div key={key} className={s.specRow}>
                                    <span className={s.specLabel}>
                                        {specTranslations[key.toLowerCase()] || key}:
                                    </span>
                                    <div className={s.dots}></div>
                                    <span className={s.specValue}>{String(value)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
'use client'
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/api/api';
import { IProduct } from '@shared/interfaces/product.interface';
import s from './Product.module.scss';
import { specTranslations } from '@/helpers/specsTranslation';
import { useActions } from '@/hooks/useActions';
import { useCart } from '@/hooks/useCart';
import { ArrowLeft, SearchX } from 'lucide-react';
import Link from 'next/link';

const ProductPage = () => {
    const params = useParams();
    const productId = params['product-id'];
    const [product, setProduct] = useState<IProduct | null>(null);
    const [loading, setLoading] = useState(true);

    const { addToCart } = useActions();
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation() 
            if(product) {
                addToCart(product)
                setIsAdded(true)
                setTimeout(() => setIsAdded(false), 1500)
            }
            
        }

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

    const renderSkeleton = () => (
        <div className={s.skeletonWrapper}>
            <div className={s.container}>
                <div className={s.imageSection}>
                    <div className={s.skeletonImage}></div>
                </div>
                <div className={s.infoSection}>
                    <div className={s.skeletonBadge}></div>
                    <div className={s.skeletonTitle}></div>
                    <div className={s.skeletonPrice}></div>
                    <div className={s.skeletonText}></div>
                    <div className={s.skeletonText} style={{ width: '80%' }}></div>
                    <div className={s.skeletonButton}></div>
                    <div className={s.skeletonSpecs}></div>
                </div>
            </div>
        </div>
    );

    if (loading) return renderSkeleton();
    if (!product) {
    return (
        <div className={s.errorWrapper}>
            <div className={s.errorContent}>
                <div className={s.iconCircle}>
                    <SearchX size={48} className={s.errorIcon} />
                </div>
                <h1 className={s.errorTitle}>Товар не знайдено</h1>
                <p className={s.errorText}>
                    На жаль, ми не змогли знайти товар, який ви шукаєте. 
                    Можливо, посилання застаріло або товар був видалений.
                </p>
                <Link href="/catalogue" className={s.backBtn}>
                    <ArrowLeft size={18} />
                    Повернутися до каталогу
                </Link>
            </div>
        </div>
    );
}

    return (
        <div className={s.wrapper}>
            <div className={s.container}>
                <div className={s.imageSection}>
                    <div className={s.imageCard}>
                        
                        <Image 
                            src={product.image} 
                            alt={product.name} 
                            fill
                            priority 
                            className={s.mainImg}
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

                    <button 
                        className={`${s.buyBtn} ${isAdded ? s.added : ''}`} 
                        onClick={handleAddToCart}
                    >
                        {isAdded ? 'Додано у кошик!' : 'У кошик'}
                    </button>

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
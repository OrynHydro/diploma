'use client'
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/api/api';
import { IProduct } from '@shared/interfaces/product.interface';
import s from './Product.module.scss';
import { specTranslations } from '@/helpers/specsTranslation';
import { useActions } from '@/hooks/useActions';
import { ArrowLeft, ChevronLeft, ChevronRight, SearchX, Star } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '@/hooks/useAuth';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation'; 
import { Navigation } from 'swiper/modules';
import { ProductSlider } from '@/components/ui/ProductSlider/ProductSlider';

interface IReview {
    _id: string;
    userName: string;
    rating: number;
    text: string;
    createdAt: string;
}

const ProductPage = () => {
    const params = useParams();
    const productId = params['product-id'];
    const [product, setProduct] = useState<IProduct | null>(null);
    const [reviews, setReviews] = useState<IReview[]>([]); 
    const [loading, setLoading] = useState(true);
    
    const { user } = useAuth();

    const { addToCart } = useActions();
    const [isAdded, setIsAdded] = useState(false);

    const [reviewRating, setReviewRating] = useState(5);
    const [reviewText, setReviewText] = useState('');
    const [reviewError, setReviewError] = useState('');

    const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (product) {
            addToCart(product);
            setIsAdded(true);
            setTimeout(() => setIsAdded(false), 1500);
        }
    };

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewText.trim() || !productId) return;

        try {
            setReviewError('');
            
            const res = await api.post('/reviews', {
                productId,
                rating: reviewRating,
                text: reviewText,
                userName: user?.firstName + ' ' + user?.lastName || 'Покупець' 
            });

            setReviews(prev => [res.data.review, ...prev]);
            
            if (product) {
                setProduct({
                    ...product,
                    rating: res.data.updatedRating,
                    numReviews: res.data.updatedNumReviews
                });
            }

            setReviewText('');
            setReviewRating(5);
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setReviewError(
                    err.response?.data?.message || 
                    'Помилка при додаванні відгуку. Перевірте, чи ви авторизовані.'
                );
            } else {
                setReviewError('Сталася непередбачувана помилка.');
            }
        }
    };

    useEffect(() => {
        const fetchProductAndReviews = async () => {
            try {
                const [productRes, reviewsRes] = await Promise.all([
                    api.get(`/products/${productId}`),
                    api.get(`/reviews/${productId}`)
                ]);
                
                setProduct(productRes.data);
                setReviews(reviewsRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        if (productId) fetchProductAndReviews();
    }, [productId]);

   const [similarLoading, setSimilarLoading] = useState(true);
    const [similarProducts, setSimilarProducts] = useState<IProduct[]>([]);

    useEffect(() => {
        const fetchSimilar = async () => {
            try {
                setSimilarLoading(true);
                console.log(productId)
                const { data } = await api.get(`/products/${productId}/similar`);
                setSimilarProducts(data);
            } catch (error) {
                console.error("Помилка завантаження схожих:", error);
            } finally {
                setSimilarLoading(false);
            }
        };
        if (productId) fetchSimilar();
    }, [productId]);


    const [recentProducts, setRecentProducts] = useState<IProduct[]>([]);
    const [recentLoading, setRecentLoading] = useState(true); 
    const viewedIds = useRecentlyViewed(productId as string);

    useEffect(() => {
        const fetchRecent = async () => {
            setRecentLoading(true); 
            const idsToFetch = viewedIds.filter(id => id && id !== productId);

            if (idsToFetch.length === 0) {
                setRecentProducts([]);
                setRecentLoading(false);
                return;
            }

            try {
                const uniqueIds = Array.from(new Set(idsToFetch));
                const promises = uniqueIds.map(id => 
                    api.get(`/products/${id}`).catch(() => null)
                );
                
                const results = await Promise.all(promises);
                const validProducts = results
                    .filter(res => res !== null)
                    .map(res => res!.data);

                setRecentProducts(validProducts);
            } catch (err) {
                console.error("Помилка завантаження нещодавніх:", err);
            } finally {
                setRecentLoading(false); 
            }
        };

        fetchRecent();
    }, [viewedIds, productId]);

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
                        На жаль, we не змогли знайти товар, який ви шукаєте. 
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
                            sizes="(max-width: 768px) 100vw, 50vw" 
                            className={s.mainImg}
                            quality={100}
                            unoptimized
                        />
                    </div>
                </div>

                <div className={s.infoSection}>
                    <div className={s.headerInfo}>
                        <span className={s.brandTag}>{product.brand}</span>
                        <h1 className={s.title}>{product.name}</h1>
                        
                        <div className={s.headerRating}>
                            <div className={s.headerStars}>
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        size={16} 
                                        fill={i < Math.round(product.rating) ? "#ffbc0b" : "transparent"} 
                                        color={i < Math.round(product.rating) ? "#ffbc0b" : "#4b5563"} 
                                    />
                                ))}
                            </div>
                            <span className={s.reviewCount}>({product.numReviews} відгуків)</span>
                        </div>

                        <div className={s.priceBlock}>
                            <span className={s.price}>${product.price}</span>
                            {product.discount > 0 && (
                                <span className={s.oldPrice}>
                                    ${Math.round(product.price / (1 - product.discount / 100))}
                                </span>
                            )}
                        </div>

                        <div className={s.stockStatus}>
                            {product.inStock ? (
                                <span className={s.inStock}>● В наявності</span>
                            ) : (
                                <span className={s.outOfStock}>○ Немає в наявності</span>
                            )}
                        </div>
                    </div>

                    <p className={s.description}>{product.description}</p>

                    <button 
                        className={`${s.buyBtn} ${isAdded ? s.added : ''} ${!product.inStock ? s.disabled : ''}`} 
                        onClick={handleAddToCart}
                        disabled={!product.inStock}
                    >
                        {!product.inStock ? 'Немає в наявності' : (isAdded ? 'Додано у кошик!' : 'У кошик')}
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

            <ProductSlider 
                title="Схожі товари" 
                products={similarProducts} 
                isLoading={similarLoading} 
            />
            <ProductSlider 
                title="Ви нещодавно переглядали" 
                products={recentProducts} 
                isLoading={recentLoading}
            />

            <div className={s.reviewsSection}>
                <h2>Відгуки покупців ({product.numReviews})</h2>
                
                <div className={s.ratingOverview}>
                    <div className={s.bigRating}>
                        <h1>{product.rating > 0 ? product.rating.toFixed(1) : '0.0'}</h1>
                        <div className={s.stars}>
                            {[...Array(5)].map((_, i) => (
                                <Star 
                                    key={i} 
                                    size={20} 
                                    fill={i < Math.round(product.rating) ? "#ffbc0b" : "transparent"} 
                                    color={i < Math.round(product.rating) ? "#ffbc0b" : "#4b5563"} 
                                />
                            ))}
                        </div>
                        <p>На основі {product.numReviews} оцінок</p>
                    </div>

                    <form onSubmit={handleReviewSubmit} className={s.reviewForm}>
                        <h3>Залишити свій відгук</h3>
                        {reviewError && <p className={s.formError}>{reviewError}</p>}
                        
                        <div className={s.ratingSelect}>
                            <span>Ваша оцінка:</span>
                            {[1, 2, 3, 4, 5].map((num) => (
                                <button
                                    type="button"
                                    key={num}
                                    onClick={() => setReviewRating(num)}
                                    className={reviewRating >= num ? s.starActive : ''}
                                >
                                    <Star size={18} fill={reviewRating >= num ? "#ffbc0b" : "transparent"} color="#ffbc0b" />
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Поділіться вашими враженнями про цей товар..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            required
                        />

                        <button type="submit" className={s.submitReviewBtn}>
                            Надіслати відгук
                        </button>
                    </form>
                </div>

                <div className={s.reviewsList}>
                    {reviews.length > 0 ? (
                        reviews.map((rev) => (
                            <div key={rev._id} className={s.reviewItem}>
                                <div className={s.reviewHeader}>
                                    <div className={s.userMeta}>
                                        <strong>{rev.userName}</strong>
                                        <span className={s.reviewDate}>
                                            {new Date(rev.createdAt).toLocaleDateString('uk-UA')}
                                        </span>
                                    </div>
                                    <div className={s.userStars}>
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                size={14} 
                                                fill={i < rev.rating ? "#ffbc0b" : "transparent"} 
                                                color={i < rev.rating ? "#ffbc0b" : "#4b5563"} 
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className={s.reviewText}>{rev.text}</p>
                            </div>
                        ))
                    ) : (
                        <p className={s.noReviews}>На цей товар ще немає жодного відгуку. Будьте першим!</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
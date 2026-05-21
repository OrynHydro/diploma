'use client'
import React, { useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperType } from 'swiper';
import 'swiper/css';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import s from './ProductSlider.module.scss'; 
import { IProduct } from '@shared/interfaces/product.interface';
import ProductItem from '../ProductItem/ProductItem';

interface IProductSlider {
    title: string;
    products: IProduct[];
    isLoading?: boolean; 
}

export const ProductSlider = ({ title, products, isLoading }: IProductSlider) => {
    const swiperRef = useRef<SwiperType | null>(null);
    const [isBeginning, setIsBeginning] = useState(true);
    const [isEnd, setIsEnd] = useState(false);

    if (isLoading) {
        return (
            <div className={s.similarSection}>
                <h2>{title}</h2>
                <div className={s.skeletonGrid}>
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={s.skeletonCard} />
                    ))}
                </div>
            </div>
        );
    }

    if (!isLoading && products.length === 0) return null;

    return (
        <div className={s.similarSection}>
            <div className={s.headerRow}>
                <h2>{title}</h2>
                <div className={s.customNavigation}>
                    <button 
                        onClick={() => swiperRef.current?.slidePrev()} 
                        className={s.arrowBtn}
                        disabled={isBeginning}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button 
                        onClick={() => swiperRef.current?.slideNext()} 
                        className={s.arrowBtn}
                        disabled={isEnd}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onSlideChange={(swiper) => {
                    setIsBeginning(swiper.isBeginning);
                    setIsEnd(swiper.isEnd);
                }}
                spaceBetween={20}
                slidesPerView={2}
                breakpoints={{ 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }}
                className={s.mySwiper}
            >
                {products.map(prod => (
                    <SwiperSlide key={prod._id}>
                        <ProductItem key={prod._id} product={prod} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};
'use client'
import React, { FC, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useActions } from '@/hooks/useActions'
import { User, Package, LogOut, ChevronRight, Mail, Edit3, MessageSquare, Star, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import s from './Profile.module.scss'
import ProfileEditForm from '@/components/ui/ProfileEdit/ProfileEdit'
import { api } from '@/api/api'
import Link from 'next/link'
interface IUserReview {
    _id: string;
    rating: number;
    text: string;
    createdAt: string;
    product: {
        _id: string;
        name: string;
        image: string;
        price: number;
    } | null; 
}

const Profile: FC = () => {
    const { user, isLoading } = useAuth()
    const { logout } = useActions()
    
    // Стейт для активної вкладки
    const [activeTab, setActiveTab] = useState<'orders' | 'edit' | 'reviews'>('orders')
    
    // Стейт для відгуків користувача
    const [myReviews, setMyReviews] = useState<IUserReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)

    const handleLogout = async () => {
        try {
            await api.post('/users/logout')
            logout() 
            window.location.assign('/')
        } catch (error) {
            console.error('Помилка під час виходу з акаунту:', error)
        }
    }

    useEffect(() => {
        if (activeTab === 'reviews' && user && !user.isGuest) {
            const fetchMyReviews = async () => {
                try {
                    setReviewsLoading(true)
                    const res = await api.get('/reviews/my-reviews')
                    setMyReviews(res.data)
                } catch (err) {
                    console.error('Помилка завантаження особистих відгуків:', err)
                } finally {
                    setReviewsLoading(false)
                }
            }
            fetchMyReviews()
        }
    }, [activeTab, user])

    if (isLoading) return <div className={s.loader}>Завантаження профілю...</div>

    if (!user || user.isGuest) {
        return (
            <div className={s.guestWrapper}>
                <div className={s.guestContent}>
                    <User size={60} className={s.guestIcon} />
                    <h1>Ви не авторизовані</h1>
                    <p>Увійдіть, щоб керувати профілем та бачити свої замовлення.</p>
                    <button className={s.loginBtn}>Увійти в систему</button>
                </div>
            </div>
        )
    }

    return (
        <div className={s.wrapper}>
            <div className={s.container}>
                <aside className={s.sidebar}>
                    <div className={s.userCard}>
                        <div className={s.avatarWrapper}>
                            <User size={40} />
                        </div>
                        <div className={s.userMeta}>
                            <h2>{user.name || 'Користувач'}</h2>
                            {user.email && (
                                <span><Mail size={14} /> {user.email}</span>
                            )}
                        </div>
                        <button className={s.logoutBtn} onClick={handleLogout}>
                            <LogOut size={18} /> Вийти
                        </button>
                    </div>

                    <nav className={s.menu}>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'orders' ? s.active : ''}`}
                            onClick={() => setActiveTab('orders')}
                        >
                            <Package size={20} /> Мої замовлення <ChevronRight size={16} />
                        </button>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'reviews' ? s.active : ''}`}
                            onClick={() => setActiveTab('reviews')}
                        >
                            <MessageSquare size={20} /> Мої відгуки <ChevronRight size={16} />
                        </button>
                        <button 
                            className={`${s.menuItem} ${activeTab === 'edit' ? s.active : ''}`}
                            onClick={() => setActiveTab('edit')}
                        >
                            <Edit3 size={20} /> Редагувати профіль <ChevronRight size={16} />
                        </button>
                    </nav>
                </aside>

                <main className={s.main}>
                    {activeTab === 'orders' && (
                        <section className={s.section}>
                            <h3>Останні замовлення</h3>
                            <div className={s.emptyOrders}>
                                <Package size={40} />
                                <p>У вас поки немає замовлень</p>
                                <button className={s.shopBtn}>До каталогу</button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'edit' && (
                        <section className={s.section}>
                            <h3>Налаштування профілю</h3>
                            <ProfileEditForm user={user} />
                        </section>
                    )}

                    {activeTab === 'reviews' && (
                        <section className={s.section}>
                            <h3>Історія моїх відгуків</h3>
                            
                            {reviewsLoading ? (
                                <div className={s.reviewsLoader}>Завантаження відгуків...</div>
                            ) : myReviews.length > 0 ? (
                                <div className={s.profileReviewsList}>
                                    {myReviews.map((rev) => (
                                        <div key={rev._id} className={s.profileReviewItem}>
                                            {rev.product ? (
                                                <div className={s.productMiniCard}>
                                                    <div className={s.imgBox}>
                                                        <Image src={rev.product.image} alt={rev.product.name} width={50} height={50} objectFit="contain" />
                                                    </div>
                                                    <div className={s.pInfo}>
                                                        <Link href={`/product/${rev.product._id}`} className={s.pName}>
                                                            {rev.product.name} <ArrowUpRight size={14} />
                                                        </Link>
                                                        <span className={s.pPrice}>${rev.product.price}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className={s.deletedProduct}>Товар більше недоступний в магазині</p>
                                            )}
                                            
                                            <div className={s.reviewContentBlock}>
                                                <div className={s.reviewMetaRow}>
                                                    <div className={s.userStars}>
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                size={14} 
                                                                fill={i < rev.rating ? "#ffbc0b" : "transparent"} 
                                                                color={i < rev.rating ? "#ffbc0b" : "#e4e4e7"} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className={s.date}>
                                                        {new Date(rev.createdAt).toLocaleDateString('uk-UA')}
                                                    </span>
                                                </div>
                                                <p className={s.reviewText}>{rev.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className={s.emptyOrders}>
                                    <MessageSquare size={40} />
                                    <p>Ви ще не залишили жодного відгуку</p>
                                    <button className={s.shopBtn} onClick={() => setActiveTab('orders')}>До замовлень</button>
                                </div>
                            )}
                        </section>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Profile
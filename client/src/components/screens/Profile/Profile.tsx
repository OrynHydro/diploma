'use client'
import React, { FC, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useActions } from '@/hooks/useActions'
import { User, Package, LogOut, Settings, ChevronRight, Mail, Edit3 } from 'lucide-react'
import Image from 'next/image'
import s from './Profile.module.scss'
import ProfileEditForm from '@/components/ui/ProfileEdit/ProfileEdit'

const Profile: FC = () => {
    const { user, isLoading } = useAuth()
    const { logout } = useActions()
    
    // Стейт для перемикання між замовленнями та редагуванням
    const [activeTab, setActiveTab] = useState<'orders' | 'edit'>('orders')

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
                            {/* Перевірка на наявність пошти */}
                            {user.email && (
                                <span><Mail size={14} /> {user.email}</span>
                            )}
                        </div>
                        <button className={s.logoutBtn} onClick={() => logout()}>
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
                            className={`${s.menuItem} ${activeTab === 'edit' ? s.active : ''}`}
                            onClick={() => setActiveTab('edit')}
                        >
                            <Edit3 size={20} /> Редагувати профіль <ChevronRight size={16} />
                        </button>
                    </nav>
                </aside>

                <main className={s.main}>
                    {activeTab === 'orders' ? (
                        <section className={s.section}>
                            <h3>Останні замовлення</h3>
                            <div className={s.emptyOrders}>
                                <Package size={40} />
                                <p>У вас поки немає замовлень</p>
                                <button className={s.shopBtn}>До каталогу</button>
                            </div>
                        </section>
                    ) : (
                        <section className={s.section}>
                            <h3>Налаштування профілю</h3>
                            <ProfileEditForm user={user} />
                        </section>
                    )}
                </main>
            </div>
        </div>
    )
}

export default Profile
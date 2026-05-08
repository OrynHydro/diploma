'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Search, Laptop, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Імпортуємо твій хук
import s from './Header.module.scss';

const Header: React.FC = () => {
  const pathname = usePathname();
  const { isAuth } = useAuth(); // Отримуємо статус авторизації

  const navLinks = [
    { name: 'Каталог', href: '/catalog' },
    { name: 'Акції', href: '/deals' },
    { name: 'Доставка', href: '/delivery' },
  ];

  return (
    <header className={s.header}>
      <div className={s.container}>
        <div className={s.navWrapper}>
          
          <Link href="/" className={s.logoSection}>
            <div className={s.iconBox}>
              <Laptop size={24} />
            </div>
            <span className={s.logoText}>TechStore</span>
          </Link>

          <nav className={s.desktopNav}>
            {navLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={pathname === link.href ? s.active : ''}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className={s.actionsSection}>
            <div className={s.searchBar}>
              <Search size={18} />
              <input type="text" placeholder="Пошук..." />
            </div>

            <div className={s.buttonGroup}>
              <Link href="/cart" className={s.iconBtn}>
                <ShoppingCart size={24} />
                <span className={s.badge}>3</span>
              </Link>
              
              {isAuth ? (
                <Link href="/profile" className={`${s.iconBtn} ${s.userBtn}`}>
                  <User size={24} />
                </Link>
              ) : (
                <Link href="/auth" className={s.loginBtn}>
                  <LogIn size={18} />
                  <span>Увійти</span>
                </Link>
              )}

            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
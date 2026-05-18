'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { ShoppingCart, User, Search, Laptop, LogIn, Loader2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; 
import { useCart } from '@/hooks/useCart';
import { useSearch } from '@/hooks/useSearch'; // Імпортуємо наш хук
import s from './Header.module.scss';
import { IProduct } from '@shared/interfaces/product.interface';

const Header: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuth } = useAuth(); 
  const { items } = useCart();
  
  // Юзаємо наш пошуковий хук
  const { searchTerm, setSearchTerm, results, isPending } = useSearch();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: 'Каталог', href: '/catalogue' },
    { name: 'Акції', href: '/deals' },
    { name: 'Доставка', href: '/delivery' },
  ];

  // Закриваємо пошук при кліку в будь-яке інше місце
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Якщо юзер тисне Enter — перекидаємо на повноцінну сторінку каталогу з фільтром
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      setIsDropdownOpen(false);
      router.push(`/catalogue?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  // console.log(results)

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
            {/* Обгортка для пошуку з рефом */}
            <div className={s.searchContainer} ref={searchRef}>
             <div className={s.searchBar}>
              {isPending ? (
                <Loader2 size={18} className={s.spinner} />
              ) : (
                <Search size={18} />
              )}
              
              <input 
                type="text" 
                placeholder="Пошук..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
              />

              {/* КНОПКА ОЧИЩЕННЯ */}
              {searchTerm && (
                <button 
                  type="button" 
                  className={s.clearBtn} 
                  onClick={() => {
                    setSearchTerm('');
                    setIsDropdownOpen(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>

              {/* Випадаюче вікно з результатами */}
              {isDropdownOpen && searchTerm.trim() && (
                <div className={s.searchDropdown}>
                  {results.length > 0 ? (
                    <div className={s.resultsList}>
                      {results.slice(0, 5).map((product: IProduct) => (
                        <Link
                          key={product._id}
                          href={`/product/${product._id}`}
                          className={s.resultItem}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className={s.productImg}>
                            <Image 
                              src={product.image} 
                              alt={product.name} 
                              width={40} 
                              height={40} 
                              style={{ objectFit: 'contain' }}
                            />
                          </div>
                          <div className={s.productInfo}>
                            <span className={s.productName}>{product.name}</span>
                            <span className={s.productPrice}>${product.price}</span>
                          </div>
                        </Link>
                      ))}
                      <Link 
                        href={`/catalogue?search=${searchTerm}`}
                        className={s.viewAll}
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Показати всі результати ({results.length})
                      </Link>
                    </div>
                  ) : (
                    <div className={s.noResults}>
                      {!isPending && 'Нічого не знайдено'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={s.buttonGroup}>
              <Link href="/cart" className={s.iconBtn}>
                <ShoppingCart size={24} />
                <span className={s.badge}>{items.length}</span>
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
import React from 'react'
import s from './Footer.module.scss'
import Link from 'next/link'

export const Footer = () => {
    const navLinks = [
    { name: 'Головна', path: '/' },
    { name: 'Каталог', path: '/catalogue' },
    { name: 'Акції', path: '/discounts' },
    { name: 'Доставка', path: '/delivery' },
    { name: 'Кошик', path: '/cart' },
    { name: 'Профіль', path: '/profile' },
    ];

  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.section}>
          <h3>TechStore</h3>
          <p>Найкраща техніка для твого життя.</p>
        </div>
        
        <div className={s.section}>
          <h4>Навігація</h4>
            <nav className={s.nav}>
                {navLinks.map(link => (
                    <Link key={link.path} href={link.path} className={s.navLink}>
                    {link.name}
                    </Link>
                ))}
            </nav>
        </div>

        <div className={s.section}>
          <h4>Контакти</h4>
          <p>м. Дніпро, вул. Святослава Хороброго, 12</p>
          <p>+38 (067) 000-00-00</p>
        </div>
      </div>
      
      <div className={s.bottom}>
        <p>© {new Date().getFullYear()} TechStore. Всі права захищені.</p>
      </div>
    </footer>
  )
}
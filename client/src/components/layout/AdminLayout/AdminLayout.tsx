'use client'
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import s from './AdminLayout.module.scss';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading || !isAdmin) {
    return <div className={s.loader}>Перевірка прав доступу...</div>;
  }

  return (
    <div className={s.adminContainer}>
      <aside className={s.sidebar}>
        <nav>
          <ul>
            <li><Link href="/admin">Головна</Link></li>
            <li><Link href="/admin/products">Товари</Link></li>
            <li><Link href="/admin/orders">Замовлення</Link></li>
            <li className={s.divider}><Link href="/">На головну сайту</Link></li>
          </ul>
        </nav>
      </aside>
      <main className={s.adminContent}>
        {children}
      </main>
    </div>
  );
}
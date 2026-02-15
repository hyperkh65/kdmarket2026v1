'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, ShoppingBag, User, Package } from 'lucide-react';
import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide on detail pages if needed, but usually persistent nav is good
  if (pathname.startsWith('/admin')) return null;

  return (
    <nav className={styles.nav}>
      <Link href="/" className={`${styles.item} ${pathname === '/' ? styles.active : ''}`}>
        <Home size={24} />
        <span>홈</span>
      </Link>
      <Link href="/picker" className={`${styles.item} ${pathname === '/picker' ? styles.active : ''}`}>
        <Package size={24} />
        <span>피커</span>
      </Link>
      <Link href="/cart" className={`${styles.item} ${pathname === '/cart' ? styles.active : ''}`}>
        <ShoppingBag size={24} />
        <span>장바구니</span>
      </Link>
      <Link href="/admin" className={`${styles.item} ${pathname === '/admin' ? styles.active : ''}`}>
        <User size={24} />
        <span>MY</span>
      </Link>
    </nav>
  );
}

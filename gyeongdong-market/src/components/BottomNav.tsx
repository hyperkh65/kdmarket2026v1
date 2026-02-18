'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map as MapIcon, ShoppingBag, User, Package, MessageSquare, Shield } from 'lucide-react';
import styles from './BottomNav.module.css';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  // Determine if we should show dark mode navigation
  const isDarkMode = pathname === '/explore' || pathname === '/my';

  useEffect(() => {
    const role = localStorage.getItem('user_role');
    if (role === 'ADMIN') {
      setIsAdmin(true);
    }
  }, []);

  // Hide on certain admin pages if needed, but keeping consistent for now
  if (pathname.startsWith('/admin') && pathname !== '/admin') return null;

  const getNavClass = () => `${styles.nav} ${isDarkMode ? styles.navDark : ''}`;
  const getItemClass = (path: string) => {
    const isActive = pathname === path;
    return `${styles.item} ${isDarkMode ? styles.itemDark : ''} ${isActive ? styles.active : ''}`;
  };

  return (
    <nav className={getNavClass()}>
      {/* 1. HOME */}
      <Link href="/" className={getItemClass('/')}>
        <Home size={24} strokeWidth={pathname === '/' ? 2.5 : 2} />
        <span>홈</span>
      </Link>

      {/* 2. EXPLORE (Map) */}
      <Link href="/explore" className={getItemClass('/explore')}>
        <MapIcon size={24} strokeWidth={pathname === '/explore' ? 2.5 : 2} />
        <span>탐색</span>
      </Link>

      {/* 3. ACTIVITY (Center - Market Path/Course) */}
      <Link href="/activity" className={getItemClass('/activity')}>
        <div style={{
          background: 'var(--primary)',
          borderRadius: '50%',
          width: '48px',
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px',
          boxShadow: '0 4px 10px rgba(255, 90, 0, 0.3)',
          border: isDarkMode ? '4px solid #1E1E1E' : '4px solid white' // Match background
        }}>
          <Package size={24} color="white" strokeWidth={2.5} />
        </div>
        <span style={{ marginTop: '4px' }}>활동</span>
      </Link>

      {/* 4. FEED (Community) */}
      <Link href="/feed" className={getItemClass('/feed')}>
        <MessageSquare size={24} strokeWidth={pathname === '/feed' ? 2.5 : 2} />
        <span>피드</span>
      </Link>

      {/* 5. MY (Profile) */}
      <Link href="/my" className={getItemClass('/my')}>
        <User size={24} strokeWidth={pathname === '/my' ? 2.5 : 2} />
        <span>마이</span>
      </Link>

      {/* 6. ADMIN (Conditional) */}
      {isAdmin && (
        <Link href="/admin" className={getItemClass('/admin')}>
          <Shield size={24} strokeWidth={pathname === '/admin' ? 2.5 : 2} color={isDarkMode ? '#FF5A00' : '#FF5A00'} />
          <span style={{ color: '#FF5A00', fontWeight: 700 }}>관리</span>
        </Link>
      )}
    </nav>
  );
}

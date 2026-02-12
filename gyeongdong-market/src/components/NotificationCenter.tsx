'use client';

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import styles from './Notifications.module.css';
import { Bell, X } from 'lucide-react';

interface Notification {
    id: string;
    message: string;
    type: 'order' | 'status' | 'info';
    timestamp: Date;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Subscribe to order changes
        const channel = supabase
            .channel('order-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                },
                (payload) => {
                    const newNotif: Notification = {
                        id: Date.now().toString(),
                        message: `주문 상태 변경: ${payload.new.status}`,
                        type: 'status',
                        timestamp: new Date()
                    };
                    setNotifications(prev => [newNotif, ...prev].slice(0, 10));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <button className={styles.bellButton} onClick={() => setIsOpen(!isOpen)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className={styles.panel}>
                    <div className={styles.header}>
                        <h3>알림</h3>
                        <button onClick={() => setIsOpen(false)}><X size={18} /></button>
                    </div>
                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.empty}>알림이 없습니다.</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className={styles.item}>
                                    <p>{notif.message}</p>
                                    <span className={styles.time}>
                                        {notif.timestamp.toLocaleTimeString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

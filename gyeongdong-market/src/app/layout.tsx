import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import BottomNav from '@/components/BottomNav';

const inter = Inter({ subsets: ['latin'] });

export { metadata } from './metadata';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ko" suppressHydrationWarning>
            <body className={inter.className} suppressHydrationWarning>
                <CartProvider>
                    <div className="container">
                        {children}
                        <BottomNav />
                    </div>
                </CartProvider>
            </body>
        </html>
    );
}

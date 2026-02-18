import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Download, Palette, Share2 } from 'lucide-react';

const THEMES = [
    { name: 'Sunset', bg: 'bg-gradient-to-br from-orange-400 to-pink-600', text: 'text-white' },
    { name: 'Ocean', bg: 'bg-gradient-to-br from-blue-400 to-emerald-400', text: 'text-white' },
    { name: 'Midnight', bg: 'bg-gradient-to-br from-slate-900 to-slate-700', text: 'text-emerald-400' },
    { name: 'Berry', bg: 'bg-gradient-to-br from-purple-500 to-rose-500', text: 'text-white' },
];

export function CardPreview({ data, onReset }) {
    const cardRef = useRef(null);
    const [activeTheme, setActiveTheme] = useState(THEMES[0]);
    const [isExporting, setIsExporting] = useState(false);

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsExporting(true);

        try {
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                backgroundColor: null,
            });

            const link = document.createElement('a');
            link.download = `card-news-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto animate-fade-in-up">
            <div className="flex gap-4 p-4 bg-white/50 backdrop-blur rounded-2xl shadow-sm border border-white/20">
                {THEMES.map((theme) => (
                    <button
                        key={theme.name}
                        onClick={() => setActiveTheme(theme)}
                        className={`w-10 h-10 rounded-full ${theme.bg} ring-2 ring-offset-2 transition-all ${activeTheme.name === theme.name ? 'ring-indigo-500 scale-110' : 'ring-transparent hover:scale-105'}`}
                        title={theme.name}
                    />
                ))}
            </div>

            <div className="relative group">
                {/* Card Container */}
                <div
                    ref={cardRef}
                    className={`relative w-[400px] h-[500px] p-8 rounded-3xl shadow-2xl ${activeTheme.bg} flex flex-col justify-between overflow-hidden transition-all duration-500`}
                >
                    {/* Decorative shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="w-12 h-1 bg-white/30 rounded-full mb-6" />
                        <h1 className={`text-3xl font-bold mb-6 leading-tight ${activeTheme.text} drop-shadow-md`}>
                            {data.title}
                        </h1>
                        <div className="space-y-4">
                            {data.content.map((point, i) => (
                                <p key={i} className={`text-lg font-medium opacity-90 leading-relaxed ${activeTheme.text}`}>
                                    • {point}
                                </p>
                            ))}
                        </div>
                    </div>

                    <div className="relative z-10 flex items-center justify-between mt-auto pt-8 border-t border-white/20">
                        <span className={`text-sm font-semibold uppercase tracking-wider opacity-75 ${activeTheme.text}`}>
                            Daily Digest
                        </span>
                        <div className={`w-8 h-8 rounded-full bg-white/20`} />
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleDownload}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                >
                    <Download size={20} />
                    {isExporting ? 'Saving...' : 'Download Image'}
                </button>
                <button
                    onClick={onReset}
                    className="px-6 py-3 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
                >
                    Create New
                </button>
            </div>
        </div>
    );
}

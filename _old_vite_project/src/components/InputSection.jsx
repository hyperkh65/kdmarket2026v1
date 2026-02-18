import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export function InputSection({ onGenerate, isLoading }) {
    const [text, setText] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (text.trim()) {
            onGenerate(text);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">
                Create Card News
            </h2>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none text-slate-600 placeholder-slate-400"
                    placeholder="Paste your blog content here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading}
                ></textarea>

                <div className="mt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={isLoading || !text.trim()}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} />
                                Generate Magic Card
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

import React, { useState } from 'react';
import { InputSection } from './components/InputSection';
import { CardPreview } from './components/CardPreview';
import { summarizeText } from './services/summarizer';

function App() {
  const [step, setStep] = useState('input'); // 'input' | 'preview'
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (text) => {
    setIsLoading(true);
    try {
      const data = await summarizeText(text);
      setSummaryData(data);
      setStep('preview');
    } catch (error) {
      console.error(error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setSummaryData(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none" />

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-12 md:py-20 flex flex-col items-center">
        <header className="text-center mb-16 space-y-4">
          <div className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 font-bold text-sm rounded-full mb-2">
            AI-Powered Magic ✨
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Blog to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Card News</span>
          </h1>
          <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto">
            Turn your long articles into shareable, beautiful card news in seconds.
            Just paste your content and watch the magic happen.
          </p>
        </header>

        <div className="w-full transition-all duration-500 ease-in-out transform">
          {step === 'input' ? (
            <div className="animate-fade-in">
              <InputSection onGenerate={handleGenerate} isLoading={isLoading} />
            </div>
          ) : (
            <CardPreview data={summaryData} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

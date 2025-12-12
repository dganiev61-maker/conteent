import React, { useState, useEffect } from 'react';
import { Language } from './types';
import { translations } from './translations';
import { GoogleGenAI } from "@google/genai";

interface LandingPageProps {
  onGetStarted: () => void;
  lang: Language;
  onLangChange: (l: Language) => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center transform hover:scale-105 hover:border-red-500 transition-all duration-300">
        <div className="flex justify-center items-center mb-4 text-red-500">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, lang, onLangChange }) => {
  const t = translations[lang];
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const generateThematicImage = async () => {
      if (heroImage) return; // Prevent re-generation
      setIsGenerating(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: 'Cinematic digital art of a high-tech samurai mask resting on a minimalist desk. Next to it is a glowing holographic content calendar with icons for Instagram, YouTube, and Telegram. Color palette: Deep Black, Vibrant Red, and Clean White. 16:9 aspect ratio, 8k resolution, professional lighting, sharp focus.',
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
          },
        });

        if (response.generatedImages?.[0]?.image?.imageBytes) {
          const base64ImageBytes = response.generatedImages[0].image.imageBytes;
          setHeroImage(`data:image/png;base64,${base64ImageBytes}`);
        }
      } catch (error) {
        console.error("Failed to generate hero image:", error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateThematicImage();
  }, []);

  return (
    <div className="bg-gray-900 text-gray-100 font-sans selection:bg-red-500 selection:text-white">
      {/* Header */}
      <header className="container mx-auto px-6 py-6 flex justify-between items-center sticky top-0 bg-gray-900/80 backdrop-blur-md z-50">
        <div className="text-2xl font-black text-red-600 tracking-tighter uppercase flex items-center gap-2">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71L12 2z" />
            </svg>
            {t.title}
        </div>
        <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden sm:flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                {(['ru', 'en', 'uz'] as Language[]).map(l => (
                    <button
                        key={l}
                        onClick={() => onLangChange(l)}
                        className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                            lang === l ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button 
                onClick={onGetStarted}
                className="px-6 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 font-bold transition-all shadow-lg hover:shadow-red-900/40 active:scale-95"
            >
                {t.login}
            </button>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="relative overflow-hidden pt-20 pb-32 px-6">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full opacity-10 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 0 L100 0 L100 100 L0 100 Z" fill="url(#grad)" />
                    <defs>
                        <radialGradient id="grad" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#dc2626" />
                            <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                    </defs>
                </svg>
            </div>
            
            <div className="container mx-auto text-center relative z-10">
                <h1 className="text-5xl md:text-8xl font-black text-white leading-tight mb-8 animate-fade-in" 
                    dangerouslySetInnerHTML={{ 
                        __html: lang === 'en' 
                            ? 'Master your content with <span class="text-red-600">Warrior Discipline</span>.' 
                            : (lang === 'uz' ? 'Kontentingizni <span class="text-red-600">Jangchi Intizomi</span> bilan boshqaring.' : 'Овладейте контентом с <span class="text-red-600">Дисциплиной Воина</span>.') 
                    }} 
                />
                <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 font-medium">
                    {lang === 'ru' ? 'Превратите хаос идей в четкую стратегию. Планируйте, анализируйте и побеждайте в мире социальных медиа.' : 
                     (lang === 'en' ? 'Turn the chaos of ideas into a clear strategy. Plan, analyze, and conquer the world of social media.' : 
                     'G\'oyalar xaosini aniq strategiyaga aylantiring. Ijtimoiy media dunyosini rejalashtiring, tahlil qiling va zabt eting.')}
                </p>

                {/* Thematic Hero Image */}
                <div className="max-w-5xl mx-auto mb-12 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl aspect-video flex items-center justify-center">
                        {isGenerating ? (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                                    {lang === 'ru' ? 'Затачиваем клинок...' : (lang === 'en' ? 'Sharpening the blade...' : 'Tig\'ni qayramoqdamiz...')}
                                </span>
                            </div>
                        ) : heroImage ? (
                            <img src={heroImage} alt="Samurai Content Planning" className="w-full h-full object-cover animate-fade-in" />
                        ) : (
                            <div className="text-gray-700 font-black text-4xl opacity-20 uppercase tracking-tighter px-10 text-center">
                                {t.title}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={onGetStarted}
                    className="px-12 py-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xl transition-all transform hover:scale-105 shadow-2xl hover:shadow-red-600/50 active:scale-95"
                >
                    {t.getStarted}
                </button>
            </div>
        </section>

        {/* Recent Changes Section */}
        <section className="py-24 bg-gray-800/20 border-y border-gray-800">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">
                        {t.recentChanges.title}
                    </h2>
                    <p className="text-gray-400 text-lg">
                        {t.recentChanges.subtitle}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {t.recentChanges.updates.map((update, idx) => (
                        <div key={idx} className="group p-8 bg-gray-900 border border-gray-700 rounded-2xl hover:border-red-600/50 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl font-black italic text-red-600">{idx + 1}</span>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-500 transition-colors">
                                {update.title}
                            </h3>
                            <p className="text-gray-400 leading-relaxed">
                                {update.desc}
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-red-500 font-bold text-sm">
                                <span className="w-8 h-px bg-red-600"></span>
                                {lang === 'ru' ? 'СМОТРЕТЬ' : (lang === 'en' ? 'VIEW' : 'KO\'RISH')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

        {/* Core Philosophy Section */}
        <section className="py-24 px-6">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                <div className="p-8">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-red-900/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{lang === 'ru' ? 'Дисциплина' : (lang === 'en' ? 'Discipline' : 'Intizom')}</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {lang === 'ru' ? 'Регулярность — залог успеха воина. Планируйте каждый шаг.' : 
                         (lang === 'en' ? 'Regularity is the key to warrior success. Plan every step.' : 
                         'Muntazamlik — jangchi muvaffaqiyatining kalitidir. Har bir qadamni rejalashtiring.')}
                    </p>
                </div>
                <div className="p-8 border-x border-gray-800">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-red-900/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{lang === 'ru' ? 'Мудрость' : (lang === 'en' ? 'Wisdom' : 'Donolik')}</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {lang === 'ru' ? 'Анализируйте статистику охватов, чтобы знать силу своего удара.' : 
                         (lang === 'en' ? 'Analyze reach statistics to know the power of your strike.' : 
                         'O\'z zarbangiz kuchini bilish uchun qamrov statistikasini tahlil qiling.')}
                    </p>
                </div>
                <div className="p-8">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-red-900/40">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{lang === 'ru' ? 'Порядок' : (lang === 'en' ? 'Order' : 'Tartib')}</h3>
                    <p className="text-gray-400 leading-relaxed">
                        {lang === 'ru' ? 'Используйте Канбан и Календарь для наведения порядка в мыслях.' : 
                         (lang === 'en' ? 'Use Kanban and Calendar to bring order to your thoughts.' : 
                         'Fikrlaringizni tartibga solish uchun Kanban va Taqvimlardan foydalaning.')}
                    </p>
                </div>
            </div>
        </section>

        {/* Call to Action */}
        <section className="py-24 text-center px-6">
            <div className="max-w-4xl mx-auto p-12 bg-red-600 rounded-3xl shadow-2xl shadow-red-600/20 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 L100 0 L100 100 Z" fill="black" />
                    </svg>
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-8">
                        {lang === 'ru' ? 'Готовы вступить на путь контент-воина?' : 
                         (lang === 'en' ? 'Ready to embark on the path of a content warrior?' : 
                         'Kontent-jangchi yo\'liga kirishga tayyormisiz?')}
                    </h2>
                    <button 
                        onClick={onGetStarted}
                        className="px-12 py-4 bg-white text-red-600 font-black text-xl rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105"
                    >
                        {t.getStarted}
                    </button>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-950">
        <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
                <div className="text-2xl font-black text-red-600 tracking-tighter uppercase">
                    {t.title}
                </div>
                <div className="flex gap-8 text-sm font-bold text-gray-500 uppercase tracking-widest">
                    <a href="#" className="hover:text-red-500 transition-colors">Instagram</a>
                    <a href="#" className="hover:text-red-500 transition-colors">Telegram</a>
                    <a href="#" className="hover:text-red-500 transition-colors">Twitter</a>
                </div>
            </div>
            <div className="text-center text-gray-600 text-xs">
                &copy; {new Date().getFullYear()} {t.title}. {lang === 'ru' ? 'Все права защищены кодексом чести.' : (lang === 'en' ? 'All rights reserved by the code of honor.' : 'Barcha huquqlar sharaf kodeksi bilan himoyalangan.')}
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

import React from 'react';
import { Language } from './types';
import { translations } from './translations';

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

  return (
    <div className="bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-red-500 tracking-wider">
            {t.title}
        </div>
        <div className="flex items-center gap-6">
            <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                {(['ru', 'en', 'uz'] as Language[]).map(l => (
                    <button
                        key={l}
                        onClick={() => onLangChange(l)}
                        className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                            lang === l ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {l}
                    </button>
                ))}
            </div>
            <button 
                onClick={onGetStarted}
                className="px-4 py-2 text-sm rounded-md border border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-semibold transition-colors"
            >
                {t.login}
            </button>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="text-center py-20 md:py-32 px-6 bg-gray-900">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4" dangerouslySetInnerHTML={{ __html: t.title === 'Samurai Content' ? 'Organize your content plan with <span class="text-red-500">warrior discipline</span>.' : (lang === 'uz' ? 'Kontent rejangizni <span class="text-red-500">jangchi intizomi</span> bilan tashkil qiling.' : 'Организуйте свой контент-план с <span class="text-red-500">дисциплиной воина</span>.') }} />
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                {lang === 'ru' ? 'Прекратите теряться в хаосе идей. Планируйте, отслеживайте и публикуйте посты для всех ваших соцсетей в одном месте.' : 
                 (lang === 'en' ? 'Stop getting lost in the chaos of ideas. Plan, track, and publish posts for all your social networks in one place.' : 
                 'G\'oyalar xaosida adashishni to\'xtating. Barcha ijtimoiy tarmoqlaringiz uchun postlarni bir joyda rejalashtiring, kuzating va nashr eting.')}
            </p>
            <button
                onClick={onGetStarted}
                className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                {t.getStarted}
            </button>
        </section>

        {/* ... existing Features Section (localized content) ... */}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500">
            &copy; {new Date().getFullYear()} {t.title}.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

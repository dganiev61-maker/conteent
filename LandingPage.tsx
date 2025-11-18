import React from 'react';

interface LandingPageProps {
  onGetStarted: () => void;
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

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-red-500 tracking-wider">
            Самурай Контент
        </div>
        <button 
            onClick={onGetStarted}
            className="px-4 py-2 text-sm rounded-md border border-red-600 text-red-500 hover:bg-red-600 hover:text-white font-semibold transition-colors"
        >
            Войти
        </button>
      </header>

      {/* Hero Section */}
      <main>
        <section className="text-center py-20 md:py-32 px-6 bg-gray-900">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-4">
                Организуйте свой контент-план с <span className="text-red-500">дисциплиной воина</span>.
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-8">
                Прекратите теряться в хаосе идей. Планируйте, отслеживайте и публикуйте посты для всех ваших соцсетей в одном месте.
            </p>
            <button
                onClick={onGetStarted}
                className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                Начать бесплатно
            </button>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-800/30">
            <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">Все инструменты под одним флагом</h2>
                    <p className="text-gray-400 mt-2">Мощные функции для безупречной стратегии.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                        title="Мультиплатформенность"
                    >
                        Планируйте контент для Instagram, Telegram, YouTube и других платформ, не переключая окна.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
                        title="Визуальные доски"
                    >
                        Используйте списки, календарь или Kanban-доску для наглядного представления вашего контент-плана.
                    </FeatureCard>
                    <FeatureCard
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Отслеживание статусов"
                    >
                        Легко меняйте статус каждой задачи: от "Идеи" до "Опубликовано", и никогда не упускайте дедлайны.
                    </FeatureCard>
                </div>
            </div>
        </section>
        
        {/* Final CTA Section */}
        <section className="text-center py-20 px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Готовы встать на путь контента?</h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-8">
                Присоединяйтесь и начните свой путь к идеальному контент-плану уже сегодня.
            </p>
            <button
                onClick={onGetStarted}
                className="px-8 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-transform transform hover:scale-105 shadow-lg"
            >
                Присоединиться к додзё
            </button>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500">
            &copy; {new Date().getFullYear()} Самурай Контент. Все права защищены.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

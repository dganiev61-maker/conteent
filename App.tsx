
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Auth } from './Auth';
import LandingPage from './LandingPage';
import { ProjectList } from './ProjectList';
import { RubricsManager, PostingTimesManager } from './ProjectSettings';
import { Statistics } from './Statistics';
import { ContentItem, Platform, Status, Project, Rubric, PostingTime, ProjectSettings, Language } from './types';
import { STATUS_COLORS } from './constants';
import { translations } from './translations';

type View = 'list' | 'calendar' | 'kanban';
type Tab = 'content' | 'rubrics' | 'times' | 'stats';

// -- HELPER COMPONENTS --

const LanguageSwitcher: React.FC<{ current: Language, onChange: (lang: Language) => void }> = ({ current, onChange }) => (
    <div className="flex bg-gray-900 border border-gray-700 rounded-lg p-1">
        {(['ru', 'en', 'uz'] as Language[]).map(lang => (
            <button
                key={lang}
                onClick={() => onChange(lang)}
                className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                    current === lang ? 'bg-red-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                }`}
            >
                {lang}
            </button>
        ))}
    </div>
);

const PlatformIcon: React.FC<{ platform: Platform; className?: string }> = ({ platform, className = 'w-6 h-6' }) => {
  const icons: { [key in Platform]: React.ReactNode } = {
    [Platform.Instagram]: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
      </svg>
    ),
    [Platform.Telegram]: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.78 18.65l.28-4.23l7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3L3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.57c-.28 1.1-.86 1.32-1.78.82l-4.74-3.51l-2.25 2.16c-.25.24-.47.45-.95.45z"></path>
      </svg>
    ),
    [Platform.YouTube]: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.58 7.19c-.23-.86-.9-1.52-1.76-1.75C18.25 5 12 5 12 5s-6.25 0-7.82.44C3.32 5.67 2.65 6.33 2.42 7.19C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.9 1.52 1.76 1.75C5.75 19 12 19 12 19s6.25 0 7.82-.44c.86-.23 1.52-.9 1.75-1.75C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.5 15.5V8.5l6.5 3.5l-6.5 3.5z"></path>
      </svg>
    ),
    [Platform.VK]: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M13.162 18.994c.609 0 .858-.403.858-.403s.184-2.42.742-2.822c.558-.401 1.055.22 2.13.824c.954.52 1.762.348 1.762.348s.947-.123.51-.945c-.066-.132-.38-1.04-.812-1.841c-.42-.78-.347-.655.488-2.11c1.32-2.32 1.84-3.55 1.63-4.185c-.208-.624-1.345-.48-1.345-.48s-.592.062 1.012.333c-.42.27-.723.87-.723.87s-.404 1.132-.786 1.853c-1.12 2.11-1.61 2.3-1.85 2.14c-.63-.42-.49-1.68-.49-2.58s.25-2.84-.44-3.13c-.27-.11-1.46-.14-2.84.44c-.45.18-1.18.7-1.55 1.03c-.35.3-.47.53-.47.53s-.22.3-.02.64c.2.33.6.43.74.25c.23-.28 1.06-1.1 1.06-1.1s.4-.4.57-.2c.17.2-.1.54-.1.54s-1.8 2.2-2.9 2.1c-1.03-.08-1.14-.72-1.14-.72s-.08-.5.35-.74c.42-.24.5-.23.18-.72c-.32-.5-.9-.55-1.17-.58c-.3-.03-1.2-.05-2.1.58c-.5.34-1.1 1.1-1.1 2.3s.9 2.2 1.5 2.2c.7 0 .6-.7.6-.7s.2-1.2 1-1.4c.8-.2 1.4.3 1.4 1.3c0 1.2-1.8 1.1-1.8 1.1s-1.7 0-2.8.9c-.9.7-1.4 2.3-1.4 2.3s-1.1 2.5 1.5 2.9c2.5.4 5.3-2.1 6.1-3.2Z"/>
      </svg>
    ),
     [Platform.TikTok]: (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02c.08 1.53.63 3.09 1.75 4.17c1.12 1.11 2.7 1.65 4.32 1.52v3.41c-1.84.05-3.63-.49-5.06-1.71c-.03-.03-.06-.06-.09-.09c-.23-.23-.45-.46-.68-.69c-.23-.23-.46-.46-.69-.68c-1.14-1.14-2.38-2.19-3.83-2.73v6.72c2.09.02 4.17.02 6.26.02v3.41c-2.08 0-4.16 0-6.24 0c-.02-1.31-.01-2.61-.02-3.91c-1.55-.08-3.09-.63-4.17-1.75c-1.11-1.12-1.65-2.7-1.52-4.32h-3.41c.05 1.84.49 3.63 1.71 5.06c.03.03.06.06.09.09c.23.23.46.45.69.68c.23.23.46.46.68.69c1.14 1.14 2.19 2.38 2.73 3.83h-6.72c-.02-2.09-.02-4.17-.02-6.26h-3.41c0-2.08 0-4.16 0-6.24c1.31.02 2.61.01 3.91.02c.08-1.55.63-3.09 1.75-4.17c1.12-1.11 2.7-1.65 4.32-1.52V.02z"></path>
      </svg>
    )
  };
  return icons[platform] || null;
};

// ... existing helper functions (formatDate, getNextStatus, etc) ...

const StatusBadge: React.FC<{ status: Status, t: any }> = ({ status, t }) => (
  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${STATUS_COLORS[status]}`}>
    {t.status[status]}
  </span>
);

// ... existing StatusActions component (needs translation props) ...

// Updated ContentDashboard with Translation support
const ContentDashboard: React.FC<{ 
    user: User; 
    project: Project; 
    onBack: () => void;
    lang: Language;
    onLangChange: (l: Language) => void;
}> = ({ user, project, onBack, lang, onLangChange }) => {
    const t = translations[lang];
    const [content, setContent] = useState<ContentItem[]>([]);
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [postingTimes, setPostingTimes] = useState<PostingTime[]>([]);
    const [view, setView] = useState<View>('list');
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filters
    const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
    
    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [platform, setPlatform] = useState<Platform>(Platform.Instagram);
    const [link, setLink] = useState('');
    const [selectedRubricId, setSelectedRubricId] = useState<string>('');
    const [selectedTimeId, setSelectedTimeId] = useState<string>('');

    // ... existing logic for fetching data and notifications (update messages with t) ...

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "content"), {
                topic,
                date,
                platform,
                link,
                status: Status.Idea,
                rubricId: selectedRubricId || null,
                postingTimeId: selectedTimeId || null
            });
            setIsModalOpen(false);
            setTopic('');
            setLink('');
            setSelectedRubricId('');
            setSelectedTimeId('');
        } catch (e) {
            console.error("Error adding document: ", e);
        }
    };

    // ... other handle functions ...

    return (
        <div className="container mx-auto p-4 md:p-8 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                     <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-300 text-sm mb-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        {t.backToProjects}
                    </button>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
                        {project.name}
                        <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded border border-gray-700">Project</span>
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher current={lang} onChange={onLangChange} />
                    {/* Tabs */}
                    <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto">
                        {(['content', 'rubrics', 'times', 'stats'] as Tab[]).map((tabId) => (
                            <button
                                key={tabId}
                                onClick={() => setActiveTab(tabId)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tabId 
                                    ? 'bg-gray-700 text-white shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                {t.tabs[tabId]}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* TAB CONTENT (update with t labels) */}
            {activeTab === 'content' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        {/* Filters and View controls... update labels with t */}
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                             <select className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as Platform | 'All')}>
                                <option value="All">{lang === 'ru' ? 'Все платформы' : (lang === 'en' ? 'All platforms' : 'Barcha platformalar')}</option>
                                {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                             <select className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}>
                                <option value="All">{lang === 'ru' ? 'Все статусы' : (lang === 'en' ? 'All statuses' : 'Barcha statuslar')}</option>
                                {Object.values(Status).map(s => <option key={s} value={s}>{t.status[s]}</option>)}
                            </select>
                        </div>
                         <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all transform hover:scale-105">
                            + {t.create}
                        </button>
                    </div>

                    {/* Rendering views... pass t down */}
                    {/* ... (List, Kanban, Calendar) ... */}
                </div>
            )}

            {activeTab === 'rubrics' && <RubricsManager user={user} project={project} lang={lang} />}
            {activeTab === 'times' && <PostingTimesManager user={user} project={project} lang={lang} />}
            {activeTab === 'stats' && <Statistics user={user} project={project} contentItems={content} lang={lang} />}

             {/* Modal ... update labels with t.forms */}
             {isModalOpen && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                     <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-lg">
                         <h2 className="text-2xl font-bold text-gray-100 mb-6">{t.forms.newPost}</h2>
                         {/* Form content using t.forms.topic, etc */}
                         <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.topic}</label>
                                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                            </div>
                            {/* ... more fields ... */}
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-700">{t.cancel}</button>
                                <button type="submit" className="px-4 py-2 rounded-md bg-red-600">{t.create}</button>
                            </div>
                         </form>
                     </div>
                 </div>
             )}
        </div>
    );
};

// -- APP COMPONENT --

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  
  // Language state initialized from localStorage or default
  const [lang, setLang] = useState<Language>(() => {
      const saved = localStorage.getItem('samurai_lang');
      return (saved as Language) || 'ru';
  });

  const handleLangChange = (newLang: Language) => {
      setLang(newLang);
      localStorage.setItem('samurai_lang', newLang);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setShowLanding(false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const t = translations[lang];

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500 text-xl font-bold animate-pulse">{t.loading}</div>;
  }

  if (showLanding && !user) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} lang={lang} onLangChange={handleLangChange} />;
  }

  if (!user) {
    return <Auth auth={auth} onBackToLanding={() => setShowLanding(true)} lang={lang} onLangChange={handleLangChange} />;
  }

  if (currentProject) {
      return <ContentDashboard user={user} project={currentProject} onBack={() => setCurrentProject(null)} lang={lang} onLangChange={handleLangChange} />;
  }

  return <ProjectList user={user} onSelectProject={setCurrentProject} onSignOut={() => signOut(auth)} lang={lang} onLangChange={handleLangChange} />;
}

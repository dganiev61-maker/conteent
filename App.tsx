
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Auth } from './Auth';
import LandingPage from './LandingPage';
import { ProjectList } from './ProjectList';
import { RubricsManager, PostingTimesManager } from './ProjectSettings';
import { Statistics } from './Statistics';
import { ContentItem, Platform, Status, Project, Rubric, PostingTime, ProjectSettings } from './types';
import { STATUS_COLORS } from './constants';

type View = 'list' | 'calendar' | 'kanban';
type Tab = 'content' | 'rubrics' | 'times' | 'stats';

// -- HELPER COMPONENTS --

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
        <path d="M13.162 18.994c.609 0 .858-.403.858-.403s.184-2.42.742-2.822c.558-.401 1.055.22 2.13.824c.954.52 1.762.348 1.762.348s.947-.123.51-.945c-.066-.132-.38-1.04-.812-1.841c-.42-.78-.347-.655.488-2.11c1.32-2.32 1.84-3.55 1.63-4.185c-.208-.624-1.345-.48-1.345-.48s-.592.062-1.012.333c-.42.27-.723.87-.723.87s-.404 1.132-.786 1.853c-1.12 2.11-1.61 2.3-1.85 2.14c-.63-.42-.49-1.68-.49-2.58s.25-2.84-.44-3.13c-.27-.11-1.46-.14-2.84.44c-.45.18-1.18.7-1.55 1.03c-.35.3-.47.53-.47.53s-.22.3-.02.64c.2.33.6.43.74.25c.23-.28 1.06-1.1 1.06-1.1s.4-.4.57-.2c.17.2-.1.54-.1.54s-1.8 2.2-2.9 2.1c-1.03-.08-1.14-.72-1.14-.72s-.08-.5.35-.74c.42-.24.5-.23.18-.72c-.32-.5-.9-.55-1.17-.58c-.3-.03-1.2-.05-2.1.58c-.5.34-1.1 1.1-1.1 2.3s.9 2.2 1.5 2.2c.7 0 .6-.7.6-.7s.2-1.2 1-1.4c.8-.2 1.4.3 1.4 1.3c0 1.2-1.8 1.1-1.8 1.1s-1.7 0-2.8.9c-.9.7-1.4 2.3-1.4 2.3s-1.1 2.5 1.5 2.9c2.5.4 5.3-2.1 6.1-3.2Z"/>
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

const StatusBadge: React.FC<{ status: Status }> = ({ status }) => (
  <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${STATUS_COLORS[status]}`}>
    {status}
  </span>
);

interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<ContentItem, 'id'>) => void;
  rubrics: Rubric[];
  postingTimes: PostingTime[];
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onSave, rubrics, postingTimes }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<Platform>(Platform.Instagram);
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<Status>(Status.Idea);
  const [link, setLink] = useState('');
  const [rubricId, setRubricId] = useState('');
  const [postingTimeId, setPostingTimeId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Тема Поста не может быть пустой');
      return;
    }
    onSave({ 
        date, 
        platform, 
        topic, 
        status, 
        link, 
        rubricId: rubricId || undefined, 
        postingTimeId: postingTimeId || undefined 
    });
    onClose();
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setPlatform(Platform.Instagram);
    setTopic('');
    setStatus(Status.Idea);
    setLink('');
    setRubricId('');
    setPostingTimeId('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-red-500 mb-6">Новый Пост</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Дата</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Время публикации</label>
                <select value={postingTimeId} onChange={(e) => setPostingTimeId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                    <option value="">Не выбрано</option>
                    {postingTimes.map(t => (
                        <option key={t.id} value={t.id}>{t.time} {t.label ? `(${t.label})` : ''}</option>
                    ))}
                </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Рубрика</label>
            <select value={rubricId} onChange={(e) => setRubricId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                <option value="">Без рубрики</option>
                {rubrics.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Платформа</label>
            <select value={platform} onChange={(e) => setPlatform(e.target.value as Platform)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
              {Object.values(Platform).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Тема Поста</label>
            <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} required placeholder="О чем будет пост?" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Статус</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
              {Object.values(Status).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Ссылка</label>
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors">Отмена</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold transition-colors">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// -- MAIN APPLICATION COMPONENT --

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [showAuthPage, setShowAuthPage] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setShowAuthPage(false);
        setActiveProject(null);
      }
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // user state will be updated by onAuthStateChanged listener
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Не удалось выйти из аккаунта.");
    }
  };
  
  if (loadingAuth) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-red-500 text-xl">Загрузка...</div>
        </div>
    );
  }

  if (!user) {
    return showAuthPage
      ? <Auth auth={auth} onBackToLanding={() => setShowAuthPage(false)} />
      : <LandingPage onGetStarted={() => setShowAuthPage(true)} />;
  }

  if (!activeProject) {
      return <ProjectList user={user} onSelectProject={setActiveProject} onSignOut={handleSignOut} />;
  }

  return <ContentDashboard user={user} project={activeProject} onBackToProjects={() => setActiveProject(null)} onSignOut={handleSignOut} />;
}

// -- CONTENT DASHBOARD COMPONENT --
interface ContentDashboardProps {
    user: User;
    project: Project;
    onBackToProjects: () => void;
    onSignOut: () => void;
}

const ContentDashboard: React.FC<ContentDashboardProps> = ({ user, project, onBackToProjects, onSignOut }) => {
  const [view, setView] = useState<View>('list');
  const [activeTab, setActiveTab] = useState<Tab>('content');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allItems, setAllItems] = useState<ContentItem[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [postingTimes, setPostingTimes] = useState<PostingTime[]>([]);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>({
      notificationMinutes: 30,
      notificationTitleTemplate: 'Напоминание: {topic}',
      notificationBodyTemplate: 'Пост запланирован через {time} в {platform}'
  });
  const [filters, setFilters] = useState({ platform: 'all', status: 'all' });
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Track notifications to avoid double sending in session
  const notifiedIds = useRef<Set<string>>(new Set());

  // Request Notification Permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);
  
  // Fetch Content
  useEffect(() => {
    if (!user || !project) return;
    const q = query(collection(db, "users", user.uid, "projects", project.id, "content"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsFromDb: ContentItem[] = [];
      querySnapshot.forEach((doc) => {
        itemsFromDb.push({ id: doc.id, ...doc.data() } as ContentItem);
      });
      setAllItems(itemsFromDb);
    });
    return () => unsubscribe();
  }, [user, project]);

  // Fetch Rubrics
  useEffect(() => {
      if (!user || !project) return;
      const q = query(collection(db, "users", user.uid, "projects", project.id, "rubrics"), orderBy("name"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data: Rubric[] = [];
          snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Rubric));
          setRubrics(data);
      });
      return () => unsubscribe();
  }, [user, project]);

  // Fetch Posting Times
  useEffect(() => {
      if (!user || !project) return;
      const q = query(collection(db, "users", user.uid, "projects", project.id, "postingTimes"), orderBy("time"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data: PostingTime[] = [];
          snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as PostingTime));
          setPostingTimes(data);
      });
      return () => unsubscribe();
  }, [user, project]);

  // Fetch Notification Settings
  useEffect(() => {
      if (!user || !project) return;
      const docRef = doc(db, "users", user.uid, "projects", project.id, "settings", "notifications");
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            setProjectSettings(docSnap.data() as ProjectSettings);
        } else {
            // Defaults
             setProjectSettings({
                notificationMinutes: 30,
                notificationTitleTemplate: 'Напоминание: {topic}',
                notificationBodyTemplate: 'Пост запланирован через {time} в {platform}'
            });
        }
      });
      return () => unsubscribe();
  }, [user, project]);

  // Check for notifications
  useEffect(() => {
    if (!allItems.length || !postingTimes.length) return;

    const checkNotifications = () => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const now = new Date();
            
            allItems.forEach(item => {
                // Skip if published or no time selected
                if (item.status === Status.Published || !item.postingTimeId) return;

                const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);
                if (!timeSlot) return;

                // Parse date and time
                // item.date is YYYY-MM-DD
                const [year, month, day] = item.date.split('-').map(Number);
                const [hours, minutes] = timeSlot.time.split(':').map(Number);
                
                // Construct date in local time
                const postDate = new Date(year, month - 1, day, hours, minutes);
                
                // Calculate difference in minutes
                const diffMs = postDate.getTime() - now.getTime();
                const diffMinutes = diffMs / (1000 * 60);

                // Create a unique key for this notification instance + settings check
                const notificationKey = `${item.id}-${item.date}-${timeSlot.time}-${projectSettings.notificationMinutes}`;
                const targetMinutes = projectSettings.notificationMinutes;

                // Check window: e.g. if target is 30, trigger between 29 and 30.5 to catch it in the 1-min interval
                if (diffMinutes >= (targetMinutes - 1) && diffMinutes <= (targetMinutes + 0.5) && !notifiedIds.current.has(notificationKey)) {
                     
                     // Format message using template
                     const formatString = (str: string) => {
                         return str
                            .replace('{topic}', item.topic)
                            .replace('{platform}', item.platform)
                            .replace('{time}', timeSlot.time);
                     };

                     new Notification(formatString(projectSettings.notificationTitleTemplate || 'Напоминание'), {
                        body: formatString(projectSettings.notificationBodyTemplate || 'Пора публиковать пост'),
                        icon: '/vite.svg' 
                     });
                     notifiedIds.current.add(notificationKey);
                }
            });
        }
    };

    const intervalId = setInterval(checkNotifications, 60000); // Check every minute
    checkNotifications(); // Check immediately on load

    return () => clearInterval(intervalId);

  }, [allItems, postingTimes, projectSettings]);

  const handleAddItem = useCallback(async (item: Omit<ContentItem, 'id'>) => {
    if (!user || !project) return;
    try {
      await addDoc(collection(db, "users", user.uid, "projects", project.id, "content"), item);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Ошибка при сохранении поста!");
    }
  }, [user, project]);

  const handleUpdateItemStatus = useCallback(async (itemId: string, status: Status) => {
    if (!user || !project) return;
    try {
      const itemRef = doc(db, "users", user.uid, "projects", project.id, "content", itemId);
      await updateDoc(itemRef, { status });
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Ошибка при обновлении статуса!");
    }
  }, [user, project]);

  const handleUpdateItemDate = useCallback(async (itemId: string, date: string) => {
    if (!user || !project) return;
    try {
      const itemRef = doc(db, "users", user.uid, "projects", project.id, "content", itemId);
      await updateDoc(itemRef, { date });
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Ошибка при обновлении даты!");
    }
  }, [user, project]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!user || !project) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "content", itemId));
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Ошибка при удалении поста!");
    }
  }, [user, project]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const platformMatch = filters.platform === 'all' || item.platform === filters.platform;
      const statusMatch = filters.status === 'all' || item.status === filters.status;
      return platformMatch && statusMatch;
    });
  }, [allItems, filters]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="text-center sm:text-left">
                 <div className="flex items-center gap-3">
                    <button onClick={onBackToProjects} className="p-2 rounded-full hover:bg-gray-800 transition-colors" aria-label="Back to projects">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-4xl font-bold text-red-500 tracking-wider" title={project.name}>{project.name}</h1>
                </div>
                <p className="text-gray-400 mt-1 pl-10">Путь контента - путь воина</p>
            </div>
            <div className="flex items-center space-x-2">
                 <span className="text-gray-400 text-sm mr-2 hidden md:block" title={user.email || 'user'}>{user.email}</span>
                <button onClick={onSignOut} title="Выйти" className="p-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 border-b border-gray-700 mb-6 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('content')} 
                className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'content' ? 'border-red-600 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                Контент
            </button>
            <button 
                onClick={() => setActiveTab('rubrics')} 
                className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'rubrics' ? 'border-red-600 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                Рубрики
            </button>
             <button 
                onClick={() => setActiveTab('times')} 
                className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'times' ? 'border-red-600 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                Время публикаций
            </button>
             <button 
                onClick={() => setActiveTab('stats')} 
                className={`py-2 px-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'stats' ? 'border-red-600 text-red-500' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
            >
                Статистика
            </button>
        </div>

        {/* Content Area */}
        <main>
            {activeTab === 'content' && (
                <>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                            <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Список</button>
                            <button onClick={() => setView('calendar')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Календарь</button>
                            <button onClick={() => setView('kanban')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Доска</button>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors shadow-md w-full md:w-auto">
                            Новый Пост
                        </button>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                            <label htmlFor="platform-filter" className="text-sm font-medium text-gray-400 mr-2">Платформа:</label>
                            <select id="platform-filter" value={filters.platform} onChange={e => setFilters(f => ({...f, platform: e.target.value}))} className="w-full sm:w-auto bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                                <option value="all">Все</option>
                                {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                            <label htmlFor="status-filter" className="text-sm font-medium text-gray-400 mr-2">Статус:</label>
                            <select id="status-filter" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))} className="w-full sm:w-auto bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                                <option value="all">Все</option>
                                {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <button onClick={() => setFilters({platform: 'all', status: 'all'})} className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors">Сбросить</button>
                    </div>

                    {view === 'list' ? (
                        <ContentTable items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} onUpdateStatus={handleUpdateItemStatus} onUpdateDate={handleUpdateItemDate} onDeleteItem={handleDeleteItem} />
                    ) : view === 'calendar' ? (
                        <CalendarView items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} currentDate={currentDate} setCurrentDate={setCurrentDate} />
                    ) : (
                        <KanbanView items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} onUpdateStatus={handleUpdateItemStatus} onUpdateDate={handleUpdateItemDate} onDeleteItem={handleDeleteItem} />
                    )}
                </>
            )}

            {activeTab === 'rubrics' && <RubricsManager user={user} project={project} />}
            {activeTab === 'times' && <PostingTimesManager user={user} project={project} />}
            {activeTab === 'stats' && <Statistics user={user} project={project} contentItems={allItems} />}
        </main>
      </div>

      <ContentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddItem}
        rubrics={rubrics}
        postingTimes={postingTimes}
       />
    </div>
  );
}


// -- VIEW COMPONENTS --

const StatusActions: React.FC<{
  item: ContentItem;
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUpdateStatus, onUpdateDate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(item.date);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingDate(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDelete = () => {
    if (window.confirm(`Вы уверены, что хотите удалить пост "${item.topic}"?`)) {
      onDelete(item.id);
    }
  };

  const handleSaveDate = () => {
      onUpdateDate(item.id, newDate);
      setIsOpen(false);
      setIsEditingDate(false);
  };

  return (
    <div className="flex items-center space-x-1">
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => { setIsOpen(!isOpen); setIsEditingDate(false); setNewDate(item.date); }} className="p-2 rounded-md hover:bg-gray-700/50 transition-colors" aria-haspopup="true" aria-expanded={isOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-20 animate-fade-in-up-fast">
             {isEditingDate ? (
                 <div className="p-4">
                     <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">Новая дата</p>
                     <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-sm mb-3 focus:ring-red-500 focus:border-red-500"
                     />
                     <div className="flex justify-between gap-2">
                         <button 
                            onClick={() => setIsEditingDate(false)} 
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                         >
                            Отмена
                         </button>
                         <button 
                            onClick={handleSaveDate} 
                            className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                         >
                            Сохранить
                         </button>
                     </div>
                 </div>
             ) : (
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-700">
                      <button 
                        onClick={() => setIsEditingDate(true)}
                        className="flex items-center gap-2 w-full text-left text-sm text-gray-300 hover:text-white transition-colors"
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Изменить дату
                      </button>
                  </div>
                  <span className="block px-4 py-2 text-xs text-gray-500 uppercase tracking-wider mt-1">Изменить статус</span>
                  {Object.values(Status).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateStatus(item.id, s);
                        setIsOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
             )}
          </div>
        )}
      </div>
      <button onClick={handleDelete} className="p-2 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-red-500 transition-colors" aria-label="Delete item">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};


const ContentTable: React.FC<{ 
    items: ContentItem[];
    rubrics: Rubric[];
    postingTimes: PostingTime[];
    onUpdateStatus: (id: string, status: Status) => void;
    onUpdateDate: (id: string, date: string) => void;
    onDeleteItem: (id: string) => void;
}> = ({ items, rubrics, postingTimes, onUpdateStatus, onUpdateDate, onDeleteItem }) => (
  <div className="overflow-x-auto bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
    <table className="w-full text-left border-collapse">
      <thead className="bg-gray-900 text-gray-500 uppercase text-xs">
        <tr>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Дата/Время</th>
           <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Рубрика</th>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Платформа</th>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Тема</th>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Статус</th>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider">Ссылка</th>
          <th className="px-6 py-4 border-b border-gray-700 font-semibold tracking-wider text-right">Действия</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {items.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
              Пока нет постов. Самое время создать первый!
            </td>
          </tr>
        ) : (
          items.map((item) => {
            const rubric = rubrics.find(r => r.id === item.rubricId);
            const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);
            return (
                <tr key={item.id} className="hover:bg-gray-700/30 transition-colors duration-150">
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-200">
                        {new Date(item.date).toLocaleDateString('ru-RU')}
                    </div>
                    {timeSlot && (
                         <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {timeSlot.time}
                        </div>
                    )}
                </td>
                 <td className="px-6 py-4 whitespace-nowrap">
                    {rubric ? (
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-200 border border-gray-600`}>
                             <span className={`w-2 h-2 rounded-full mr-1.5 ${rubric.color}`}></span>
                             {rubric.name}
                         </span>
                    ) : (
                        <span className="text-gray-600 text-xs">-</span>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                    <div className="flex items-center gap-2">
                         <PlatformIcon platform={item.platform} />
                         <span className="text-sm">{item.platform}</span>
                    </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-200">{item.topic}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-red-400 hover:text-red-300 hover:underline flex items-center text-sm">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Открыть
                    </a>
                    ) : (
                    <span className="text-gray-600 text-sm">-</span>
                    )}
                </td>
                <td className="px-6 py-4 text-right">
                    <StatusActions 
                        item={item} 
                        onUpdateStatus={onUpdateStatus} 
                        onUpdateDate={onUpdateDate}
                        onDelete={onDeleteItem} 
                    />
                </td>
                </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

const CalendarView: React.FC<{ items: ContentItem[]; rubrics: Rubric[]; postingTimes: PostingTime[]; currentDate: Date; setCurrentDate: (date: Date) => void }> = ({ items, rubrics, postingTimes, currentDate, setCurrentDate }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Adjust for Monday start (Russian locale standard)
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthName = currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
  const capMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 md:p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">{capMonthName}</h2>
        <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded-lg overflow-hidden">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <div key={d} className="bg-gray-800 p-2 text-center text-sm font-semibold text-gray-400">{d}</div>
        ))}
        {blanks.map(b => <div key={`blank-${b}`} className="bg-gray-900/50 h-32 md:h-40"></div>)}
        {days.map(day => {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayItems = items.filter(i => i.date === dateStr);
          return (
            <div key={day} className="bg-gray-900 h-32 md:h-40 p-2 overflow-y-auto hover:bg-gray-800/80 transition-colors">
              <div className="text-sm font-bold text-gray-500 mb-1">{day}</div>
              <div className="space-y-1">
                {dayItems.map(item => {
                   const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);
                   return (
                    <div key={item.id} className={`text-xs p-1.5 rounded border ${STATUS_COLORS[item.status]} bg-opacity-20`}>
                        <div className="flex items-center justify-between mb-0.5">
                             <PlatformIcon platform={item.platform} className="w-3 h-3 opacity-70" />
                             {timeSlot && <span className="text-[10px] opacity-70">{timeSlot.time}</span>}
                        </div>
                        <div className="truncate font-medium leading-tight" title={item.topic}>{item.topic}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const KanbanView: React.FC<{ 
    items: ContentItem[]; 
    rubrics: Rubric[];
    postingTimes: PostingTime[];
    onUpdateStatus: (id: string, status: Status) => void;
    onUpdateDate: (id: string, date: string) => void;
    onDeleteItem: (id: string) => void;
}> = ({ items, rubrics, postingTimes, onUpdateStatus, onUpdateDate, onDeleteItem }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 animate-fade-in-up">
      {Object.values(Status).map(status => {
        const statusItems = items.filter(i => i.status === status);
        return (
          <div key={status} className="bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col min-w-[280px]">
            <div className={`p-3 border-b border-gray-700 font-bold text-gray-200 flex justify-between items-center ${
                status === Status.Idea ? 'border-t-4 border-t-blue-500' :
                status === Status.InProgress ? 'border-t-4 border-t-yellow-500' :
                status === Status.Ready ? 'border-t-4 border-t-green-500' :
                'border-t-4 border-t-gray-500'
            }`}>
              <span>{status}</span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">{statusItems.length}</span>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] scrollbar-thin scrollbar-thumb-gray-600">
              {statusItems.map(item => {
                 const rubric = rubrics.find(r => r.id === item.rubricId);
                 const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);

                 return (
                    <div key={item.id} className="bg-gray-800 border border-gray-700 p-3 rounded shadow-sm hover:shadow-md hover:border-gray-500 transition-all group">
                    <div className="flex justify-between items-start mb-2">
                         <div className="flex gap-2 items-center">
                            {rubric && (
                                <div className={`w-2 h-2 rounded-full ${rubric.color}`} title={rubric.name}></div>
                            )}
                            <div className="text-xs text-gray-400 font-mono">{new Date(item.date).toLocaleDateString('ru-RU')}</div>
                         </div>
                         <PlatformIcon platform={item.platform} className="w-4 h-4 text-gray-500" />
                    </div>
                    
                    <h4 className="text-sm font-semibold text-gray-200 mb-2 leading-snug">{item.topic}</h4>
                    
                    {timeSlot && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {timeSlot.time}
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-gray-700/50 mt-2">
                        {item.link ? (
                            <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300">Ссылка</a>
                        ) : <span></span>}
                        <StatusActions item={item} onUpdateStatus={onUpdateStatus} onUpdateDate={onUpdateDate} onDelete={onDeleteItem} />
                    </div>
                    </div>
                 );
              })}
              {statusItems.length === 0 && (
                  <div className="text-center text-xs text-gray-600 py-4 italic">Пусто</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

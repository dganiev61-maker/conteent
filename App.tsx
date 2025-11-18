import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Auth } from './Auth';
import { ContentItem, Platform, Status } from './types';
import { STATUS_COLORS } from './constants';

type View = 'list' | 'calendar' | 'kanban';

// -- HELPER COMPONENTS (Defined outside main App to prevent re-creation on re-renders) --

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
        <path d="M13.162 18.994c.609 0 .858-.403.858-.403s.184-2.42.742-2.822c.558-.401 1.055.22 2.13.824c.954.52 1.762.348 1.762.348s.947-.123.51-.945c-.066-.132-.38-1.04-.812-1.841c-.42-
        .78-.347-.655.488-2.11c1.32-2.32 1.84-3.55 1.63-4.185c-.208-.624-1.345-.48-1.345-.48s-.592.062-1.012.333c-.42.27-.723.87-.723.87s-.404 1.132-.786 1.853c-1.12 2.11-1.61 2.3-1.85
        2.14c-.63-.42-.49-1.68-.49-2.58s.25-2.84-.44-3.13c-.27-.11-1.46-.14-2.84.44c-.45.18-1.18.7-1.55 1.03c-.35.3-.47.53-.47.53s-.22.3-.02.64c.2.33.6.43.74.25c.23-.28 1.06-1.1
        1.06-1.1s.4-.4.57-.2c.17.2-.1.54-.1.54s-1.8 2.2-2.9 2.1c-1.03-.08-1.14-.72-1.14-.72s-.08-.5.35-.74c.42-.24.5-.23.18-.72c-.32-.5-.9-.55-1.17-.58c-.3-.03-1.2-.05-2.1.58c-.5.34-1.1
        1.1-1.1 2.3s.9 2.2 1.5 2.2c.7 0 .6-.7.6-.7s.2-1.2 1-1.4c.8-.2 1.4.3 1.4 1.3c0 1.2-1.8 1.1-1.8 1.1s-1.7 0-2.8.9c-.9.7-1.4 2.3-1.4 2.3s-1.1 2.5 1.5 2.9c2.5.4 5.3-2.1 6.1-3.2Z"/>
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
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, onSave }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState<Platform>(Platform.Instagram);
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<Status>(Status.Idea);
  const [link, setLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      alert('Тема Поста не может быть пустой');
      return;
    }
    onSave({ date, platform, topic, status, link });
    onClose();
    // Reset form
    setDate(new Date().toISOString().split('T')[0]);
    setPlatform(Platform.Instagram);
    setTopic('');
    setStatus(Status.Idea);
    setLink('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-red-500 mb-6">Новый Пост</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Дата</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
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
  const [view, setView] = useState<View>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allItems, setAllItems] = useState<ContentItem[]>([]);
  const [filters, setFilters] = useState({ platform: 'all', status: 'all' });
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setAllItems([]);
      return;
    }
    const q = query(collection(db, "users", user.uid, "content"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsFromDb: ContentItem[] = [];
      querySnapshot.forEach((doc) => {
        itemsFromDb.push({
          id: doc.id,
          ...doc.data(),
        } as ContentItem);
      });
      setAllItems(itemsFromDb);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddItem = useCallback(async (item: Omit<ContentItem, 'id'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "content"), item);
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Ошибка при сохранении поста!");
    }
  }, [user]);

  const handleUpdateItemStatus = useCallback(async (itemId: string, status: Status) => {
    if (!user) return;
    try {
      const itemRef = doc(db, "users", user.uid, "content", itemId);
      await updateDoc(itemRef, { status });
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Ошибка при обновлении статуса!");
    }
  }, [user]);

  const handleDeleteItem = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "content", itemId));
    } catch (e) {
      console.error("Error deleting document: ", e);
      alert("Ошибка при удалении поста!");
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Не удалось выйти из аккаунта.");
    }
  };

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const platformMatch = filters.platform === 'all' || item.platform === filters.platform;
      const statusMatch = filters.status === 'all' || item.status === filters.status;
      return platformMatch && statusMatch;
    });
  }, [allItems, filters]);

  if (loadingAuth) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="text-red-500 text-xl">Загрузка...</div>
        </div>
    );
  }

  if (!user) {
    return <Auth auth={auth} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <div className="text-center sm:text-left">
                <h1 className="text-4xl font-bold text-red-500 tracking-wider">Самурай Контент</h1>
                <p className="text-gray-400 mt-1">Путь контента - путь воина</p>
            </div>
            <div className="flex items-center space-x-2">
                 <span className="text-gray-400 text-sm mr-2 hidden md:block" title={user.email || 'user'}>{user.email}</span>
                <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                    <button onClick={() => setView('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Список</button>
                    <button onClick={() => setView('calendar')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Календарь</button>
                    <button onClick={() => setView('kanban')} className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-red-600' : 'hover:bg-gray-700'}`}>Доска</button>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors shadow-md">Новый Пост</button>
                <button onClick={handleSignOut} title="Выйти" className="p-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>

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

        {/* Content Area */}
        <main>
          {view === 'list' ? (
            <ContentTable items={filteredItems} onUpdateStatus={handleUpdateItemStatus} onDeleteItem={handleDeleteItem} />
          ) : view === 'calendar' ? (
            <CalendarView items={filteredItems} currentDate={currentDate} setCurrentDate={setCurrentDate} />
          ) : (
             <KanbanView items={filteredItems} onUpdateStatus={handleUpdateItemStatus} />
          )}
        </main>
      </div>

      <ContentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddItem} />
    </div>
  );
}


// -- VIEW COMPONENTS --

const StatusActions: React.FC<{
  item: ContentItem;
  onUpdate: (id: string, status: Status) => void;
  onDelete: (id: string) => void;
}> = ({ item, onUpdate, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  return (
    <div className="flex items-center space-x-1">
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md hover:bg-gray-700/50 transition-colors" aria-haspopup="true" aria-expanded={isOpen}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-md shadow-lg z-10 animate-fade-in-up-fast">
            <div className="py-1">
              <span className="block px-4 py-2 text-xs text-gray-500 uppercase tracking-wider">Изменить статус</span>
              {Object.values(Status).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    onUpdate(item.id, s);
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
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
    onUpdateStatus: (id: string, status: Status) => void;
    onDeleteItem: (id: string) => void;
}> = ({ items, onUpdateStatus, onDeleteItem }) => {
    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-max text-sm text-left">
                    <thead className="bg-gray-800 border-b border-gray-700">
                        <tr>
                            <th className="p-4 font-semibold text-gray-300">Дата</th>
                            <th className="p-4 font-semibold text-gray-300">Платформа</th>
                            <th className="p-4 font-semibold text-gray-300 w-1/2">Тема Поста</th>
                            <th className="p-4 font-semibold text-gray-300">Статус</th>
                            <th className="p-4 font-semibold text-gray-300">Ссылка</th>
                            <th className="p-4 font-semibold text-gray-300">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length > 0 ? items.map(item => (
                            <tr key={item.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                <td className="p-4 whitespace-nowrap">{new Date(item.date + 'T00:00:00').toLocaleDateString('ru-RU')}</td>
                                <td className="p-4"><PlatformIcon platform={item.platform} /></td>
                                <td className="p-4 font-medium">{item.topic}</td>
                                <td className="p-4"><StatusBadge status={item.status} /></td>
                                <td className="p-4">
                                    {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors">🔗</a>}
                                </td>
                                <td className="p-4">
                                    <StatusActions item={item} onUpdate={onUpdateStatus} onDelete={onDeleteItem} />
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center p-8 text-gray-500">Нет записей. Добавьте новый пост.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const CalendarView: React.FC<{ items: ContentItem[], currentDate: Date, setCurrentDate: (date: Date) => void }> = ({ items, currentDate, setCurrentDate }) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    const weekStartsOn = 1; // Monday
    const startDay = (firstDayOfMonth - weekStartsOn + 7) % 7;

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    const itemsByDate = useMemo(() => {
        const map = new Map<string, ContentItem[]>();
        items.forEach(item => {
            const dateKey = item.date;
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(item);
        });
        return map;
    }, [items]);

    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    &lt;
                </button>
                <h3 className="text-xl font-bold text-red-500">
                    {currentDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                    &gt;
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {weekDays.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-400 text-sm py-2">{day}</div>
                ))}
                {Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="border border-gray-700/30 rounded-md min-h-[120px]"></div>
                ))}
                {days.map(day => {
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayItems = itemsByDate.get(dateKey) || [];
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    return (
                        <div key={day} className={`border rounded-md min-h-[120px] p-2 flex flex-col ${isToday ? 'border-red-500 bg-red-900/20' : 'border-gray-700/50 bg-gray-800/20'}`}>
                            <span className={`font-bold ${isToday ? 'text-red-400' : 'text-gray-300'}`}>{day}</span>
                            <div className="mt-1 space-y-1 overflow-y-auto">
                                {dayItems.map(item => (
                                    <div key={item.id} className={`p-1 rounded-md text-xs flex items-center gap-1 ${STATUS_COLORS[item.status]} border-l-4`}>
                                        <PlatformIcon platform={item.platform} className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{item.topic}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const KanbanCard: React.FC<{ 
    item: ContentItem; 
    onDragStart: (e: React.DragEvent, itemId: string) => void;
}> = ({ item, onDragStart }) => (
    <div
        draggable
        onDragStart={(e) => onDragStart(e, item.id)}
        className="bg-gray-800 border border-gray-700 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:bg-gray-700/50 transition-colors shadow-md"
        aria-roledescription={`Post titled ${item.topic}`}
    >
        <p className="font-semibold mb-2 text-gray-200">{item.topic}</p>
        <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-2">
                <PlatformIcon platform={item.platform} className="w-4 h-4" />
                <span>{new Date(item.date + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}</span>
            </div>
            {item.link && <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors">🔗</a>}
        </div>
    </div>
);

const KanbanView: React.FC<{
    items: ContentItem[];
    onUpdateStatus: (id: string, status: Status) => void;
}> = ({ items, onUpdateStatus }) => {
    const handleDragStart = (e: React.DragEvent, itemId: string) => {
        e.dataTransfer.setData("itemId", itemId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const handleDrop = (e: React.DragEvent, newStatus: Status) => {
        e.preventDefault();
        const itemId = e.dataTransfer.getData("itemId");
        const currentItem = items.find(i => i.id === itemId);
        if (itemId && currentItem && currentItem.status !== newStatus) {
            onUpdateStatus(itemId, newStatus);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(Status).map(status => (
                <div
                    key={status}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, status)}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col"
                    aria-label={`Column for status ${status}`}
                >
                    <h3 className={`font-bold text-lg mb-4 p-2 rounded text-center ${STATUS_COLORS[status]}`}>
                        {status} ({items.filter(item => item.status === status).length})
                    </h3>
                    <div className="space-y-4 overflow-y-auto min-h-[400px] p-1 flex-grow">
                        {items
                            .filter(item => item.status === status)
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map(item => (
                                <KanbanCard key={item.id} item={item} onDragStart={handleDragStart} />
                            ))
                        }
                    </div>
                </div>
            ))}
        </div>
    );
};
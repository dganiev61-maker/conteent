import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { db, auth } from './firebase';
import { Auth } from './Auth';
import LandingPage from './LandingPage';
import { ProjectList } from './ProjectList';
import { RubricsManager, PostingTimesManager } from './ProjectSettings';
import { Statistics } from './Statistics';
import { ContentItem, Platform, Status, Project, Rubric, PostingTime, Language } from './types';
import { STATUS_COLORS } from './constants';
import { translations } from './translations';

type View = 'list' | 'calendar' | 'kanban';
type Tab = 'content' | 'rubrics' | 'times' | 'stats';

// -- HELPER FUNCTIONS --

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
};

const getNextStatus = (current: Status): Status => {
    const flow = [Status.Idea, Status.InProgress, Status.Ready, Status.Published];
    const idx = flow.indexOf(current);
    if (idx === -1) return Status.Idea;
    return flow[(idx + 1) % flow.length];
};

const getPrevStatus = (current: Status): Status => {
    const flow = [Status.Idea, Status.InProgress, Status.Ready, Status.Published];
    const idx = flow.indexOf(current);
    if (idx === -1) return Status.Idea;
    return flow[(idx - 1 + flow.length) % flow.length];
};

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
        <path d="M13.162 18.994c.609 0 .858-.403.858-.403s.184-2.42.742-2.822c.558-.401 1.055.22 2.13.824c.954.52 1.762.348 1.762.348s.947-.123.51-.945c-.066-.132-.38-1.04-.812-1.841c-.42-.78-.347-.655.488-2.11c1.32-2.32 1.84-3.55 1.63-4.185c-.208-.624-1.345-.48-1.345-.48s.592.062 1.012.333c-.42.27-.723.87-.723.87s-.404 1.132-.786 1.853c-1.12 2.11-1.61 2.3-1.85 2.14c-.63-.42-.49-1.68-.49-2.58s.25-2.84-.44-3.13c-.27-.11-1.46-.14-2.84.44c-.45.18-1.18.7-1.55 1.03c-.35.3-.47.53-.47.53s-.22.3-.02.64c.2.33.6.43.74.25c.23-.28 1.06-1.1 1.06-1.1s.4-.4.57-.2c.17.2-.1.54-.1.54s-1.8 2.2-2.9 2.1c-1.03-.08-1.14-.72-1.14-.72s-.08-.5.35-.74c.42-.24.5-.23.18-.72c-.32-.5-.9-.55-1.17-.58c-.3-.03-1.2-.05-2.1.58c-.5.34-1.1 1.1-1.1 2.3s.9 2.2 1.5 2.2c.7 0 .6-.7.6-.7s.2-1.2 1-1.4c.8-.2 1.4.3 1.4 1.3c0 1.2-1.8 1.1-1.8 1.1s-1.7 0-2.8.9c-.9.7-1.4 2.3-1.4 2.3s-1.1 2.5 1.5 2.9c2.5.4 5.3-2.1 6.1-3.2Z"/>
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

const StatusBadge: React.FC<{ status: Status; t: any }> = ({ status, t }) => (
  <span 
    key={status}
    className={`px-3 py-1 text-sm font-semibold rounded-full border status-badge-transition animate-status-fade ${STATUS_COLORS[status]}`}
  >
    {t.status[status]}
  </span>
);

const StatusActions: React.FC<{
  item: ContentItem;
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateDate: (id: string, date: string) => void;
  onDelete: (id: string) => void;
  lang: Language;
  t: any;
}> = ({ item, onUpdateStatus, onUpdateDate, onDelete, lang, t }) => {
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
    const confirmMsg = lang === 'ru' ? `Вы уверены, что хотите удалить пост "${item.topic}"?` :
                       (lang === 'en' ? `Are you sure you want to delete "${item.topic}"?` : 
                       `Haqiqatan ham "${item.topic}" postini o'chirmoqchimisiz?`);
    if (window.confirm(confirmMsg)) {
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
                     <p className="text-xs text-gray-400 mb-2 font-semibold uppercase">{t.forms.date}</p>
                     <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md px-2 py-1.5 text-sm mb-3 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]"
                     />
                     <div className="flex justify-between gap-2">
                         <button 
                            onClick={() => setIsEditingDate(false)} 
                            className="flex-1 px-3 py-1.5 text-xs bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                         >
                            {t.cancel}
                         </button>
                         <button 
                            onClick={handleSaveDate} 
                            className="flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                         >
                            {t.forms.save}
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
                        {lang === 'ru' ? 'Изменить дату' : (lang === 'en' ? 'Change date' : 'Sanani o\'zgartirish')}
                      </button>
                  </div>
                  <span className="block px-4 py-2 text-xs text-gray-500 uppercase tracking-wider mt-1">{lang === 'ru' ? 'Сменить статус' : (lang === 'en' ? 'Change status' : 'Statusni o\'zgartirish')}</span>
                  {Object.values(Status).map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        onUpdateStatus(item.id, s);
                        setIsOpen(false);
                      }}
                      className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
                    >
                      {t.status[s]}
                    </button>
                  ))}
                </div>
             )}
          </div>
        )}
      </div>
      <button onClick={handleDelete} className="p-2 rounded-md hover:bg-gray-700/50 text-gray-400 hover:text-red-500 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

// Swipeable Row Component
const SwipeableTableRow: React.FC<{
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
}> = ({ children, onSwipeLeft, onSwipeRight, className }) => {
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const [offset, setOffset] = useState(0);

    const minSwipeDistance = 75;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
        if (touchStart !== null) {
             const currentOffset = e.targetTouches[0].clientX - touchStart;
             if (Math.abs(currentOffset) < 150) {
                 setOffset(currentOffset);
             }
        }
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe && onSwipeLeft) {
            onSwipeLeft();
        } else if (isRightSwipe && onSwipeRight) {
            onSwipeRight();
        }

        setTouchStart(null);
        setTouchEnd(null);
        setOffset(0);
    };

    const style = {
        transform: `translateX(${offset}px)`,
        transition: touchStart ? 'none' : 'transform 0.3s ease-out'
    };

    return (
        <tr 
            className={`${className} touch-pan-y relative`}
            onTouchStart={onTouchStart} 
            onTouchMove={onTouchMove} 
            onTouchEnd={onTouchEnd}
            style={style}
        >
            {children}
        </tr>
    );
};

const ContentTableRow: React.FC<{
    item: ContentItem;
    rubrics: Rubric[];
    postingTimes: PostingTime[];
    onUpdateStatus: (id: string, status: Status) => void;
    onUpdateDate: (id: string, date: string) => void;
    onDeleteItem: (id: string) => void;
    lang: Language;
    t: any;
}> = ({ item, rubrics, postingTimes, onUpdateStatus, onUpdateDate, onDeleteItem, lang, t }) => {
    const rubric = rubrics.find(r => r.id === item.rubricId);
    const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);
    const rubricColor = rubric ? (rubric.color ? rubric.color.replace('600', '500') : 'bg-gray-500') : '';

    const [animClass, setAnimClass] = useState('');
    const prevStatus = useRef(item.status);

    useEffect(() => {
        if (prevStatus.current !== item.status) {
            // Trigger a subtle row highlight when status changes
            setAnimClass('animate-status-flash');
            const timer = setTimeout(() => setAnimClass(''), 800);
            prevStatus.current = item.status;
            return () => clearTimeout(timer);
        }
    }, [item.status]);

    return (
        <SwipeableTableRow 
            className={`hover:bg-gray-700/30 transition-colors duration-150 ${animClass}`}
            onSwipeRight={() => onUpdateStatus(item.id, getNextStatus(item.status))}
            onSwipeLeft={() => onUpdateStatus(item.id, getPrevStatus(item.status))}
        >
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-200">
                    {formatDate(item.date)}
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
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold text-white shadow-sm ${rubricColor}`}>
                        {rubric.name}
                    </span>
                ) : (
                    <span className="text-gray-600 text-xs">-</span>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                <div className="flex items-center space-x-2">
                    <PlatformIcon platform={item.platform} className="w-5 h-5" />
                    <span className="text-sm">{item.platform}</span>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="text-sm text-gray-100 font-medium truncate max-w-xs" title={item.topic}>
                    {item.topic}
                </div>
                 {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 hover:underline mt-1 block truncate max-w-xs">
                        {item.link}
                    </a>
                )}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={item.status} t={t} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <StatusActions 
                    item={item} 
                    onUpdateStatus={onUpdateStatus} 
                    onUpdateDate={onUpdateDate}
                    onDelete={onDeleteItem} 
                    lang={lang}
                    t={t}
                />
            </td>
        </SwipeableTableRow>
    );
};

const ContentTable: React.FC<{
  items: ContentItem[];
  rubrics: Rubric[];
  postingTimes: PostingTime[];
  onUpdateStatus: (id: string, status: Status) => void;
  onUpdateDate: (id: string, date: string) => void;
  onDeleteItem: (id: string) => void;
  lang: Language;
  t: any;
}> = ({ items, rubrics, postingTimes, onUpdateStatus, onUpdateDate, onDeleteItem, lang, t }) => (
  <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl animate-fade-in-up">
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-900">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.forms.date} / {t.forms.time}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.forms.rubric}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t.forms.platform}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/3">{t.forms.topic}</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {items.map((item) => (
             <ContentTableRow 
                key={item.id} 
                item={item} 
                rubrics={rubrics} 
                postingTimes={postingTimes}
                onUpdateStatus={onUpdateStatus} 
                onUpdateDate={onUpdateDate}
                onDeleteItem={onDeleteItem} 
                lang={lang}
                t={t}
             />
          ))}
          {items.length === 0 && (
            <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    {lang === 'ru' ? 'Нет запланированных постов.' : (lang === 'en' ? 'No scheduled posts.' : 'Rejalashtirilgan postlar yo\'q.')}
                </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const CalendarView: React.FC<{
  items: ContentItem[];
  rubrics: Rubric[];
  postingTimes: PostingTime[];
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  lang: Language;
  t: any;
}> = ({ items, rubrics, postingTimes, currentDate, setCurrentDate, lang, t }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const monthLocale = lang === 'ru' ? 'ru-RU' : (lang === 'en' ? 'en-US' : 'uz-UZ');
  const monthName = currentDate.toLocaleString(monthLocale, { month: 'long', year: 'numeric' });
  const capMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startDay }, (_, i) => i);

  const weekdayLabels = lang === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] :
                        (lang === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : 
                        ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']);

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 md:p-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">{capMonthName}</h2>
        <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded-lg overflow-hidden">
        {weekdayLabels.map(d => (
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
                    <div key={item.id} className={`text-[10px] md:text-xs p-1 rounded border ${STATUS_COLORS[item.status]} bg-opacity-20`}>
                        <div className="flex items-center justify-between mb-0.5">
                             <PlatformIcon platform={item.platform} className="w-3 h-3 opacity-70" />
                             {timeSlot && <span className="opacity-70">{timeSlot.time}</span>}
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
  lang: Language;
  t: any;
}> = ({ items, rubrics, postingTimes, onUpdateStatus, onUpdateDate, onDeleteItem, lang, t }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 overflow-x-auto pb-4 animate-fade-in-up">
      {Object.values(Status).map(status => {
        const statusItems = items.filter(i => i.status === status);
        return (
          /* Fix: Corrected nesting and added missing closing div for the status column */
          <div key={status} className="bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col min-w-[280px]">
             <div className={`p-3 border-b border-gray-700 font-bold text-gray-200 flex justify-between items-center ${
                status === Status.Idea ? 'border-t-4 border-t-blue-500' :
                status === Status.InProgress ? 'border-t-4 border-t-yellow-500' :
                status === Status.Ready ? 'border-t-4 border-t-green-500' :
                'border-t-4 border-t-gray-500'
            }`}>
              <span>{t.status[status]}</span>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded-full text-gray-300">{statusItems.length}</span>
            </div>
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] custom-scrollbar">
              {statusItems.map(item => {
                const rubric = rubrics.find(r => r.id === item.rubricId);
                const rubricColor = rubric ? (rubric.color ? rubric.color.replace('600', '500') : 'bg-gray-500') : '';
                const timeSlot = postingTimes.find(t => t.id === item.postingTimeId);
                
                return (
                  <div key={item.id} className="bg-gray-800 border border-gray-700 p-3 rounded shadow-sm hover:shadow-md hover:border-gray-500 transition-all animate-scale-in group relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <StatusActions 
                            item={item} 
                            onUpdateStatus={onUpdateStatus} 
                            onUpdateDate={onUpdateDate}
                            onDelete={onDeleteItem} 
                            lang={lang}
                            t={t}
                        />
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-8">
                        <div className="flex items-center space-x-2">
                             {rubric && (
                                <span title={rubric.name} className={`w-2.5 h-2.5 rounded-full ${rubricColor}`}></span>
                            )}
                            <div className="text-xs text-gray-400 font-mono">
                                {formatDate(item.date)}
                            </div>
                        </div>
                         <PlatformIcon platform={item.platform} className="w-4 h-4 text-gray-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-200 mb-2 leading-snug pr-2">{item.topic}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                        {timeSlot && (
                            <span className="text-xs text-gray-500 flex items-center gap-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
                                {timeSlot.time}
                            </span>
                        )}
                         {item.link && (
                            <a href={item.link} target="_blank" rel="noreferrer" className="text-red-400 text-xs hover:text-red-300 hover:underline flex items-center ml-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                {lang === 'ru' ? 'Открыть' : (lang === 'en' ? 'Open' : 'Ochish')}
                            </a>
                        )}
                    </div>
                    {/* Visual indicator of current status on the card */}
                    <div className="mt-3 pt-2 border-t border-gray-700/50">
                        <StatusBadge status={item.status} t={t} />
                    </div>
                  </div>
                );
            })}
             {statusItems.length === 0 && (
                <div className="text-center text-gray-600 text-sm py-4 italic">{lang === 'ru' ? 'Пусто' : (lang === 'en' ? 'Empty' : 'Bo\'sh')}</div>
            )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// -- MAIN DASHBOARD COMPONENT --

interface ContentDashboardProps {
    user: User; 
    project: Project; 
    onBack: () => void;
    lang: Language;
    onLangChange: (l: Language) => void;
}

const ContentDashboard: React.FC<ContentDashboardProps> = ({ user, project, onBack, lang, onLangChange }) => {
    const t = translations[lang];
    const [content, setContent] = useState<ContentItem[]>([]);
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [postingTimes, setPostingTimes] = useState<PostingTime[]>([]);
    const [view, setView] = useState<View>('list');
    const [activeTab, setActiveTab] = useState<Tab>('content');
    const [currentDate, setCurrentDate] = useState(new Date());

    const [filterPlatform, setFilterPlatform] = useState<Platform | 'All'>('All');
    const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [date, setTopicDate] = useState(new Date().toISOString().split('T')[0]);
    const [platform, setPlatform] = useState<Platform>(Platform.Instagram);
    const [link, setLink] = useState('');
    const [selectedRubricId, setSelectedRubricId] = useState<string>('');
    const [selectedTimeId, setSelectedTimeId] = useState<string>('');

    useEffect(() => {
        const q = query(collection(db, "users", user.uid, "projects", project.id, "content"), orderBy("date"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: ContentItem[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as ContentItem));
            setContent(data);
        });
        return () => unsubscribe();
    }, [user.uid, project.id]);

    useEffect(() => {
        const unsubRubrics = onSnapshot(query(collection(db, "users", user.uid, "projects", project.id, "rubrics"), orderBy("name")), (snap) => {
            const data: Rubric[] = [];
            snap.forEach(d => data.push({id: d.id, ...d.data()} as Rubric));
            setRubrics(data);
        });
        const unsubTimes = onSnapshot(query(collection(db, "users", user.uid, "projects", project.id, "postingTimes"), orderBy("time")), (snap) => {
             const data: PostingTime[] = [];
            snap.forEach(d => data.push({id: d.id, ...d.data()} as PostingTime));
            setPostingTimes(data);
        });
        return () => { unsubRubrics(); unsubTimes(); };
    }, [user.uid, project.id]);

    const filteredItems = useMemo(() => {
        return content.filter(item => {
            const matchesPlatform = filterPlatform === 'All' || item.platform === filterPlatform;
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            return matchesPlatform && matchesStatus;
        });
    }, [content, filterPlatform, filterStatus]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "content"), {
                topic,
                date: date,
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
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };

    const handleUpdateStatus = useCallback(async (id: string, status: Status) => {
        const itemRef = doc(db, "users", user.uid, "projects", project.id, "content", id);
        await updateDoc(itemRef, { status });
    }, [user.uid, project.id]);

    const handleUpdateDate = useCallback(async (id: string, date: string) => {
         const itemRef = doc(db, "users", user.uid, "projects", project.id, "content", id);
         await updateDoc(itemRef, { date });
    }, [user.uid, project.id]);

    const handleDeleteItem = useCallback(async (id: string) => {
        await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "content", id));
    }, [user.uid, project.id]);

    return (
        <div className="container mx-auto p-4 md:p-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                     <button onClick={onBack} className="flex items-center text-gray-500 hover:text-gray-300 text-sm mb-2 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                        {t.backToProjects}
                    </button>
                    <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-2">
                        {project.name}
                        <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded border border-gray-700">Project</span>
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <LanguageSwitcher current={lang} onChange={onLangChange} />
                    <div className="flex bg-gray-800 p-1 rounded-lg overflow-x-auto">
                        {(['content', 'rubrics', 'times', 'stats'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                                    activeTab === tab 
                                    ? 'bg-gray-700 text-white shadow-sm' 
                                    : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                {t.tabs[tab]}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {activeTab === 'content' && (
                <div className="animate-fade-in">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                        <div className="flex flex-wrap items-center gap-2 md:gap-4">
                             <select className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500" value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value as Platform | 'All')}>
                                <option value="All">{lang === 'ru' ? 'Все платформы' : (lang === 'en' ? 'All platforms' : 'Barcha platformalar')}</option>
                                {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select className="bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}>
                                <option value="All">{lang === 'ru' ? 'Все статусы' : (lang === 'en' ? 'All statuses' : 'Barcha statuslar')}</option>
                                {Object.values(Status).map(s => <option key={s} value={s}>{t.status[s]}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                            <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg self-start">
                                <button onClick={() => setView('list')} className={`p-2 rounded ${view === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} title={t.views.list}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                </button>
                                <button onClick={() => setView('kanban')} className={`p-2 rounded ${view === 'kanban' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} title={t.views.kanban}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                </button>
                                <button onClick={() => setView('calendar')} className={`p-2 rounded ${view === 'calendar' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`} title={t.views.calendar}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                                </button>
                            </div>
                            <button onClick={() => setIsModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:shadow-red-900/50 transition-all transform hover:scale-105 flex-1 sm:flex-none">
                                + {t.create}
                            </button>
                        </div>
                    </div>

                    {view === 'list' && <ContentTable items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} onUpdateStatus={handleUpdateStatus} onUpdateDate={handleUpdateDate} onDeleteItem={handleDeleteItem} lang={lang} t={t} />}
                    {view === 'calendar' && <CalendarView items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} currentDate={currentDate} setCurrentDate={setCurrentDate} lang={lang} t={t} />}
                    {view === 'kanban' && <KanbanView items={filteredItems} rubrics={rubrics} postingTimes={postingTimes} onUpdateStatus={handleUpdateStatus} onUpdateDate={handleUpdateDate} onDeleteItem={handleDeleteItem} lang={lang} t={t} />}
                </div>
            )}

            {activeTab === 'rubrics' && <RubricsManager user={user} project={project} lang={lang} />}
            {activeTab === 'times' && <PostingTimesManager user={user} project={project} lang={lang} />}
            {activeTab === 'stats' && <Statistics user={user} project={project} contentItems={content} lang={lang} />}

             {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl p-6 w-full max-w-lg animate-fade-in-up" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-gray-100 mb-6 border-b border-gray-700 pb-2">{t.forms.newPost}</h2>
                        <form onSubmit={handleAddItem} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.topic}</label>
                                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="..." />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.date}</label>
                                    <input type="date" value={date} onChange={e => setTopicDate(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.time}</label>
                                    <select value={selectedTimeId} onChange={e => setSelectedTimeId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                                        <option value="">-- {t.forms.noTime} --</option>
                                        {postingTimes.map(time => <option key={time.id} value={time.id}>{time.time} {time.label ? `(${time.label})` : ''}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.platform}</label>
                                    <select value={platform} onChange={e => setPlatform(e.target.value as Platform)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                                        {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.rubric}</label>
                                     <select value={selectedRubricId} onChange={e => setSelectedRubricId(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500">
                                        <option value="">-- {t.forms.noRubric} --</option>
                                        {rubrics.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.link} ({t.optional})</label>
                                <input type="url" value={link} onChange={e => setLink(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" placeholder="https://..." />
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700 mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors">{t.cancel}</button>
                                <button type="submit" className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors">{t.create}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('samurai_lang') as Language) || 'ru');

  const handleLangChange = useCallback((newLang: Language) => {
      setLang(newLang);
      localStorage.setItem('samurai_lang', newLang);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) setShowLanding(false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-500 text-xl font-bold animate-pulse">Loading...</div>;

  if (showLanding && !user) return <LandingPage onGetStarted={() => setShowLanding(false)} lang={lang} onLangChange={handleLangChange} />;
  if (!user) return <Auth auth={auth} onBackToLanding={() => setShowLanding(true)} lang={lang} onLangChange={handleLangChange} />;
  if (currentProject) return <ContentDashboard user={user} project={currentProject} onBack={() => setCurrentProject(null)} lang={lang} onLangChange={handleLangChange} />;

  return <ProjectList user={user} onSelectProject={(project) => setCurrentProject(project)} onSignOut={() => signOut(auth)} lang={lang} onLangChange={handleLangChange} />;
}


import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project, Rubric, PostingTime, ProjectSettings } from './types';

// Predefined colors for the Samurai theme context
const RUBRIC_COLORS = [
    'bg-red-600',
    'bg-orange-600',
    'bg-amber-600',
    'bg-yellow-600',
    'bg-lime-600',
    'bg-green-600',
    'bg-emerald-600',
    'bg-teal-600',
    'bg-cyan-600',
    'bg-sky-600',
    'bg-blue-600',
    'bg-indigo-600',
    'bg-violet-600',
    'bg-purple-600',
    'bg-fuchsia-600',
    'bg-pink-600',
    'bg-rose-600',
    'bg-gray-600'
];

interface SettingsProps {
    user: User;
    project: Project;
}

export const RubricsManager: React.FC<SettingsProps> = ({ user, project }) => {
    const [rubrics, setRubrics] = useState<Rubric[]>([]);
    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(RUBRIC_COLORS[0]);

    useEffect(() => {
        const q = query(collection(db, "users", user.uid, "projects", project.id, "rubrics"), orderBy("name"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Rubric[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as Rubric));
            setRubrics(data);
        });
        return () => unsubscribe();
    }, [user, project]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        try {
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "rubrics"), {
                name,
                color: selectedColor
            });
            setName('');
        } catch (error) {
            console.error("Error adding rubric:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Удалить эту рубрику?')) {
            await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "rubrics", id));
        }
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                <span className="text-red-500">#</span> Рубрикатор
            </h2>
            
            <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Название рубрики</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="Например: Обучение"
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                            required
                        />
                    </div>
                    <div className="w-full md:w-auto">
                         <label className="block text-sm font-medium text-gray-400 mb-2">Цвет метки</label>
                         <div className="flex flex-wrap gap-2 max-w-[300px]">
                            {RUBRIC_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedColor(c)}
                                    className={`w-6 h-6 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'} transition-all`}
                                />
                            ))}
                         </div>
                    </div>
                    <button type="submit" className="w-full md:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">
                        Добавить
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rubrics.map(rubric => (
                    <div key={rubric.id} className="flex justify-between items-center p-3 bg-gray-900 border border-gray-700 rounded-lg hover:border-gray-500 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${rubric.color}`}></div>
                            <span className="font-medium text-gray-200">{rubric.name}</span>
                        </div>
                        <button onClick={() => handleDelete(rubric.id)} className="text-gray-500 hover:text-red-500 transition-colors p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
                {rubrics.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                        Рубрики еще не созданы.
                    </div>
                )}
            </div>
        </div>
    );
};

export const PostingTimesManager: React.FC<SettingsProps> = ({ user, project }) => {
    const [times, setTimes] = useState<PostingTime[]>([]);
    const [timeVal, setTimeVal] = useState('');
    const [label, setLabel] = useState('');

    useEffect(() => {
        const q = query(collection(db, "users", user.uid, "projects", project.id, "postingTimes"), orderBy("time"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: PostingTime[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as PostingTime));
            setTimes(data);
        });
        return () => unsubscribe();
    }, [user, project]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!timeVal) return;
        try {
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "postingTimes"), {
                time: timeVal,
                label: label
            });
            setTimeVal('');
            setLabel('');
        } catch (error) {
            console.error("Error adding time:", error);
        }
    };

    const handleDelete = async (id: string) => {
        await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "postingTimes", id));
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Время публикаций
            </h2>

            <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Время</label>
                        <input 
                            type="time" 
                            value={timeVal} 
                            onChange={(e) => setTimeVal(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500 [color-scheme:dark]"
                            required
                        />
                    </div>
                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Метка (опционально)</label>
                        <input 
                            type="text" 
                            value={label} 
                            onChange={(e) => setLabel(e.target.value)} 
                            placeholder="Утро, Прайм-тайм..."
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                    </div>
                    <button type="submit" className="w-full md:w-1/3 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors">
                        Добавить
                    </button>
                </div>
            </form>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {times.map(t => (
                    <div key={t.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center relative group hover:border-red-500/50 transition-colors">
                        <div className="text-xl font-bold text-gray-100">{t.time}</div>
                        {t.label && <div className="text-xs text-gray-400 mt-1">{t.label}</div>}
                        <button 
                            onClick={() => handleDelete(t.id)}
                            className="absolute -top-2 -right-2 bg-gray-700 text-gray-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                ))}
                 {times.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-8">
                        Слоты времени не заданы.
                    </div>
                )}
            </div>
        </div>
    );
};

export const NotificationSettingsManager: React.FC<SettingsProps> = ({ user, project }) => {
    const [minutes, setMinutes] = useState(30);
    const [titleTemplate, setTitleTemplate] = useState('Напоминание: {topic}');
    const [bodyTemplate, setBodyTemplate] = useState('Публикация через {time} в {platform}');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const docRef = doc(db, "users", user.uid, "projects", project.id, "settings", "notifications");
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as ProjectSettings;
                setMinutes(data.notificationMinutes);
                setTitleTemplate(data.notificationTitleTemplate || 'Напоминание: {topic}');
                setBodyTemplate(data.notificationBodyTemplate || 'Публикация через {time} в {platform}');
            }
        };
        fetchSettings();
    }, [user, project]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, "users", user.uid, "projects", project.id, "settings", "notifications"), {
                notificationMinutes: Number(minutes),
                notificationTitleTemplate: titleTemplate,
                notificationBodyTemplate: bodyTemplate
            }, { merge: true });
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Не удалось сохранить настройки");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Настройки Уведомлений
            </h2>

            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                        За сколько минут отправлять уведомление?
                    </label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="number" 
                            min="1"
                            max="1440"
                            value={minutes} 
                            onChange={(e) => setMinutes(Number(e.target.value))} 
                            className="w-32 bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <span className="text-gray-400">минут до публикации</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Шаблон заголовка
                        </label>
                        <input 
                            type="text" 
                            value={titleTemplate} 
                            onChange={(e) => setTitleTemplate(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Доступно: &#123;topic&#125;, &#123;platform&#125;, &#123;time&#125;</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">
                            Шаблон текста
                        </label>
                        <input 
                            type="text" 
                            value={bodyTemplate} 
                            onChange={(e) => setBodyTemplate(e.target.value)} 
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Доступно: &#123;topic&#125;, &#123;platform&#125;, &#123;time&#125;</p>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded p-4">
                    <p className="text-sm text-gray-400 mb-2">Предпросмотр:</p>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700 flex gap-3">
                         <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                            <img src="/vite.svg" className="w-6 h-6" alt="icon" />
                         </div>
                         <div>
                             <p className="font-bold text-gray-200">
                                 {titleTemplate
                                    .replace('{topic}', 'Мой крутой пост')
                                    .replace('{platform}', 'Instagram')
                                    .replace('{time}', '15:30')}
                             </p>
                             <p className="text-sm text-gray-400">
                                 {bodyTemplate
                                    .replace('{topic}', 'Мой крутой пост')
                                    .replace('{platform}', 'Instagram')
                                    .replace('{time}', '15:30')}
                             </p>
                         </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Сохранение...' : 'Сохранить настройки'}
                    </button>
                </div>
            </form>
        </div>
    );
};

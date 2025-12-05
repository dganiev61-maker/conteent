
import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project, ContentItem, StatsRecord, Status } from './types';

interface StatisticsProps {
    user: User;
    project: Project;
    contentItems: ContentItem[];
}

type TimeRange = 1 | 3 | 6 | 9 | 12;

export const Statistics: React.FC<StatisticsProps> = ({ user, project, contentItems }) => {
    const [range, setRange] = useState<TimeRange>(1);
    const [statsRecords, setStatsRecords] = useState<StatsRecord[]>([]);
    
    // Form state
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputSubs, setInputSubs] = useState('');
    const [inputReach, setInputReach] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Fetch manual stats
    useEffect(() => {
        const q = query(collection(db, "users", user.uid, "projects", project.id, "stats"), orderBy("date", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: StatsRecord[] = [];
            snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() } as StatsRecord));
            setStatsRecords(data);
        });
        return () => unsubscribe();
    }, [user, project]);

    const handleAddStat = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputSubs || !inputReach) return;

        try {
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "stats"), {
                date: inputDate,
                subscribers: Number(inputSubs),
                reach: Number(inputReach)
            });
            setIsFormOpen(false);
            setInputSubs('');
            setInputReach('');
        } catch (error) {
            console.error("Error adding stat:", error);
            alert("Ошибка при сохранении");
        }
    };

    const handleDeleteStat = async (id: string) => {
        if(window.confirm("Удалить запись статистики?")) {
            await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "stats", id));
        }
    };

    // Calculation Logic
    const analyticsData = useMemo(() => {
        const now = new Date();
        const startDate = new Date();
        startDate.setMonth(now.getMonth() - range);

        // Filter Content
        const periodContent = contentItems.filter(item => new Date(item.date) >= startDate);
        const publishedCount = periodContent.filter(item => item.status === Status.Published).length;
        const plannedCount = periodContent.length - publishedCount;

        // Filter Stats Records
        const periodStats = statsRecords.filter(rec => new Date(rec.date) >= startDate);
        
        // Sort ascending for calculation
        const sortedStats = [...periodStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        const totalReach = sortedStats.reduce((acc, curr) => acc + curr.reach, 0);
        
        let subGrowth = 0;
        let currentSubs = 0;

        if (sortedStats.length > 0) {
            const first = sortedStats[0];
            const last = sortedStats[sortedStats.length - 1];
            subGrowth = last.subscribers - first.subscribers;
            currentSubs = last.subscribers;
        } else if (statsRecords.length > 0) {
            // If no stats in period, show latest available total
             currentSubs = statsRecords[0].subscribers; // records are desc, so 0 is latest
        }

        return {
            publishedCount,
            plannedCount,
            totalReach,
            subGrowth,
            currentSubs,
            periodStats: sortedStats // For chart/list
        };
    }, [range, contentItems, statsRecords]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {[1, 3, 6, 9, 12].map((r) => (
                    <button
                        key={r}
                        onClick={() => setRange(r as TimeRange)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                            range === r 
                            ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                    >
                        {r === 12 ? '1 Год' : `${r} Мес.`}
                    </button>
                ))}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Опубликовано</p>
                    <h3 className="text-3xl font-bold text-gray-100 mt-2">{analyticsData.publishedCount}</h3>
                    <p className="text-xs text-gray-500 mt-1">за выбранный период</p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Запланировано</p>
                    <h3 className="text-3xl font-bold text-yellow-500 mt-2">{analyticsData.plannedCount}</h3>
                     <p className="text-xs text-gray-500 mt-1">задач в работе</p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Подписчики</p>
                    <h3 className="text-3xl font-bold text-gray-100 mt-2">{analyticsData.currentSubs.toLocaleString()}</h3>
                    <p className={`text-xs mt-1 font-semibold ${analyticsData.subGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {analyticsData.subGrowth >= 0 ? '+' : ''}{analyticsData.subGrowth} за период
                    </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
                    </div>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Суммарный охват</p>
                    <h3 className="text-3xl font-bold text-gray-100 mt-2">{analyticsData.totalReach.toLocaleString()}</h3>
                    <p className="text-xs text-gray-500 mt-1">сумма записей за период</p>
                </div>
            </div>

            {/* Input Section & Data Table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Form */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">Ввод данных</h3>
                        <p className="text-gray-400 text-sm mb-4">Вносите данные регулярно, чтобы отслеживать прогресс.</p>
                        
                        {!isFormOpen ? (
                             <button 
                                onClick={() => setIsFormOpen(true)}
                                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 font-semibold transition-colors border border-gray-600 border-dashed"
                            >
                                + Добавить запись
                            </button>
                        ) : (
                            <form onSubmit={handleAddStat} className="space-y-4 animate-fade-in-up-fast">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Дата</label>
                                    <input 
                                        type="date" 
                                        value={inputDate}
                                        onChange={(e) => setInputDate(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Количество Подписчиков</label>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        value={inputSubs}
                                        onChange={(e) => setInputSubs(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Охват (за день/месяц)</label>
                                    <input 
                                        type="number" 
                                        placeholder="0"
                                        value={inputReach}
                                        onChange={(e) => setInputReach(e.target.value)}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-semibold transition-colors">Сохранить</button>
                                    <button type="button" onClick={() => setIsFormOpen(false)} className="px-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md text-sm transition-colors">Отмена</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* History List */}
                <div className="lg:col-span-2">
                     <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-800">
                             <h3 className="font-bold text-gray-200">История показателей (за выбранный период)</h3>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-gray-900 text-gray-500 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3">Дата</th>
                                        <th className="px-6 py-3">Подписчики</th>
                                        <th className="px-6 py-3">Охват</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analyticsData.periodStats.length > 0 ? (
                                        // Reverse to show newest first in table
                                        [...analyticsData.periodStats].reverse().map((stat) => (
                                            <tr key={stat.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                                                <td className="px-6 py-4 font-medium text-gray-200">
                                                    {new Date(stat.date).toLocaleDateString('ru-RU')}
                                                </td>
                                                <td className="px-6 py-4">{stat.subscribers.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-green-400">+{stat.reach.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteStat(stat.id)} className="text-gray-600 hover:text-red-500 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-600">
                                                Нет данных за этот период. Добавьте первую запись.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

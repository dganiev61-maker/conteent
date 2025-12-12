import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project, ContentItem, StatsRecord, Status, Language } from './types';
import { translations } from './translations';

interface StatisticsProps {
    user: User;
    project: Project;
    contentItems: ContentItem[];
    lang: Language;
}

type TimeRange = 1 | 3 | 6 | 9 | 12;

export const Statistics: React.FC<StatisticsProps> = ({ user, project, contentItems, lang }) => {
    const t = translations[lang];
    const [range, setRange] = useState<TimeRange>(1);
    const [statsRecords, setStatsRecords] = useState<StatsRecord[]>([]);
    const [inputDate, setInputDate] = useState(new Date().toISOString().split('T')[0]);
    const [inputSubs, setInputSubs] = useState('');
    const [inputReach, setInputReach] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);

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
                date: inputDate, subscribers: Number(inputSubs), reach: Number(inputReach)
            });
            setIsFormOpen(false); setInputSubs(''); setInputReach('');
        } catch (error) { console.error(error); }
    };

    const handleDeleteStat = async (id: string) => {
        const confirmMsg = lang === 'ru' ? 'Удалить запись?' : (lang === 'en' ? 'Delete record?' : 'Yozuvni o\'chirish?');
        if(window.confirm(confirmMsg)) {
            await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "stats", id));
        }
    };

    const analyticsData = useMemo(() => {
        const now = new Date();
        const startDate = new Date();
        startDate.setMonth(now.getMonth() - range);
        const periodContent = contentItems.filter(item => new Date(item.date) >= startDate);
        const publishedCount = periodContent.filter(item => item.status === Status.Published).length;
        const plannedCount = periodContent.length - publishedCount;
        const periodStats = statsRecords.filter(rec => new Date(rec.date) >= startDate);
        const sortedStats = [...periodStats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const totalReach = sortedStats.reduce((acc, curr) => acc + curr.reach, 0);
        let subGrowth = 0;
        let currentSubs = 0;
        if (sortedStats.length > 0) {
            subGrowth = sortedStats[sortedStats.length - 1].subscribers - sortedStats[0].subscribers;
            currentSubs = sortedStats[sortedStats.length - 1].subscribers;
        } else if (statsRecords.length > 0) {
             currentSubs = statsRecords[0].subscribers;
        }
        return { publishedCount, plannedCount, totalReach, subGrowth, currentSubs, periodStats: sortedStats };
    }, [range, contentItems, statsRecords]);

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {[1, 3, 6, 9, 12].map((r) => (
                    <button key={r} onClick={() => setRange(r as TimeRange)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${range === r ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                        {r === 12 ? t.stats.year : `${r} ${t.stats.months}`}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t.stats.published} value={analyticsData.publishedCount} color="red" />
                <StatCard title={t.stats.planned} value={analyticsData.plannedCount} color="yellow" />
                <StatCard title={t.stats.subscribers} value={analyticsData.currentSubs.toLocaleString()} growth={analyticsData.subGrowth} color="blue" />
                <StatCard title={t.stats.reach} value={analyticsData.totalReach.toLocaleString()} color="green" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-100 mb-4">{t.stats.inputData}</h3>
                        {!isFormOpen ? <button onClick={() => setIsFormOpen(true)} className="w-full py-2 bg-gray-700 border border-dashed border-gray-600 rounded-lg text-gray-200">+ {t.stats.addRecord}</button> :
                            <form onSubmit={handleAddStat} className="space-y-4">
                                <div><label className="block text-xs text-gray-500 mb-1">{t.forms.date}</label><input type="date" value={inputDate} onChange={(e) => setInputDate(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm" /></div>
                                <div><label className="block text-xs text-gray-500 mb-1">{t.stats.subscribers}</label><input type="number" value={inputSubs} onChange={(e) => setInputSubs(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm" /></div>
                                <div><label className="block text-xs text-gray-500 mb-1">{t.stats.reach}</label><input type="number" value={inputReach} onChange={(e) => setInputReach(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-sm" /></div>
                                <div className="flex gap-2"><button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-md">{t.forms.save}</button><button type="button" onClick={() => setIsFormOpen(false)} className="px-3 bg-gray-700 rounded-md">{t.cancel}</button></div>
                            </form>
                        }
                    </div>
                </div>
                <div className="lg:col-span-2">
                     <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-700 bg-gray-800"><h3 className="font-bold text-gray-200">{t.stats.history}</h3></div>
                        <div className="max-h-[300px] overflow-y-auto">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="bg-gray-900 text-gray-500 uppercase text-xs sticky top-0"><tr className="border-b border-gray-700"><th className="px-6 py-3">{t.forms.date}</th><th className="px-6 py-3">{t.stats.subscribers}</th><th className="px-6 py-3">{t.stats.reach}</th><th className="px-6 py-3"></th></tr></thead>
                                <tbody>
                                    {[...analyticsData.periodStats].reverse().map((stat) => (
                                        <tr key={stat.id} className="border-b border-gray-700/50 hover:bg-gray-700/20"><td className="px-6 py-4">{new Date(stat.date).toLocaleDateString()}</td><td className="px-6 py-4">{stat.subscribers.toLocaleString()}</td><td className="px-6 py-4 text-green-400">+{stat.reach.toLocaleString()}</td><td className="px-6 py-4 text-right"><button onClick={() => handleDeleteStat(stat.id)} className="text-gray-600 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button></td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string | number; growth?: number; color: 'red' | 'yellow' | 'blue' | 'green' }> = ({ title, value, growth, color }) => (
    <div className="bg-gray-800/50 border border-gray-700 p-6 rounded-lg relative overflow-hidden group">
        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
        <h3 className={`text-3xl font-bold mt-2 text-gray-100`}>{value}</h3>
        {growth !== undefined && (
            <p className={`text-xs mt-1 font-semibold ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>{growth >= 0 ? '+' : ''}{growth}</p>
        )}
        <div className={`absolute top-0 right-0 p-4 opacity-5 transition-opacity group-hover:opacity-10 bg-${color}-500 w-12 h-12 rounded-bl-full`} />
    </div>
);
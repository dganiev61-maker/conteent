import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project, Rubric, PostingTime, Language } from './types';
import { translations } from './translations';

const RUBRIC_COLORS = [
    'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
    'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
    'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
    'bg-pink-500', 'bg-rose-500', 'bg-gray-500'
];

interface SettingsProps {
    user: User;
    project: Project;
    lang: Language;
}

export const RubricsManager: React.FC<SettingsProps> = ({ user, project, lang }) => {
    const t = translations[lang];
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
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id: string) => {
        const confirmMsg = lang === 'ru' ? 'Удалить эту рубрику?' : (lang === 'en' ? 'Delete this rubric?' : 'Ushbu rubrikani o\'chirib tashlaysizmi?');
        if (window.confirm(confirmMsg)) {
            await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "rubrics", id));
        }
    };

    return (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                <span className="text-red-500">#</span> {t.rubricsManager.title}
            </h2>
            <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.rubricsManager.name}</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" required />
                    </div>
                    <div className="w-full md:w-auto">
                         <label className="block text-sm font-medium text-gray-400 mb-2">{t.rubricsManager.color}</label>
                         <div className="flex flex-wrap gap-2 max-w-[300px]">
                            {RUBRIC_COLORS.map(c => (
                                <button key={c} type="button" onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70'} transition-all`} />
                            ))}
                         </div>
                    </div>
                    <button type="submit" className="w-full md:w-auto px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold">{t.rubricsManager.add}</button>
                </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rubrics.map(r => (
                    <div key={r.id} className="flex justify-between items-center p-3 bg-gray-900 border border-gray-700 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full ${r.color.replace('600', '500')}`}></div>
                            <span className="font-medium text-gray-200">{r.name}</span>
                        </div>
                        <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const PostingTimesManager: React.FC<SettingsProps> = ({ user, project, lang }) => {
    const t = translations[lang];
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
            await addDoc(collection(db, "users", user.uid, "projects", project.id, "postingTimes"), { time: timeVal, label });
            setTimeVal(''); setLabel('');
        } catch (error) { console.error(error); }
    };

    const handleDelete = async (id: string) => {
        await deleteDoc(doc(db, "users", user.uid, "projects", project.id, "postingTimes", id));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t.timeManager.title}
                </h2>
                <form onSubmit={handleAdd} className="bg-gray-800 p-4 rounded-lg mb-8 border border-gray-700">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.forms.time}</label>
                            <input type="time" value={timeVal} onChange={(e) => setTimeVal(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 [color-scheme:dark]" required />
                        </div>
                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.timeManager.label}</label>
                            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                        </div>
                        <button type="submit" className="w-full md:w-1/3 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold">{t.timeManager.addSlot}</button>
                    </div>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {times.map(t => (
                        <div key={t.id} className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-center relative group">
                            <div className="text-xl font-bold text-gray-100">{t.time}</div>
                            {t.label && <div className="text-xs text-gray-400 mt-1">{t.label}</div>}
                            <button onClick={() => handleDelete(t.id)} className="absolute -top-2 -right-2 bg-gray-700 text-gray-300 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
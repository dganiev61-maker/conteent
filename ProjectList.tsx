import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project, Language } from './types';
import { translations } from './translations';

interface ProjectListProps {
    user: User;
    onSelectProject: (project: Project) => void;
    onSignOut: () => void;
    lang: Language;
    onLangChange: (l: Language) => void;
}

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
    t: any;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, t }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave(name, description);
        onClose();
    };

    useEffect(() => {
        if (!isOpen) {
            setName('');
            setDescription('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-red-500 mb-6">{t.createProject}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.projectName}</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.description} ({t.optional})</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors">{t.cancel}</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold transition-colors">{t.create}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const ProjectList: React.FC<ProjectListProps> = ({ user, onSelectProject, onSignOut, lang, onLangChange }) => {
    const t = translations[lang];
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const q = query(collection(db, "users", user.uid, "projects"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const projectsFromDb: Project[] = [];
            querySnapshot.forEach((doc) => {
                projectsFromDb.push({ id: doc.id, ...doc.data() } as Project);
            });
            setProjects(projectsFromDb);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [user.uid]);

    const handleAddProject = async (name: string, description: string) => {
        try {
            await addDoc(collection(db, "users", user.uid, "projects"), {
                name,
                description,
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error adding project: ", e);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold text-red-500 tracking-wider">{t.myProjects}</h1>
                        <p className="text-gray-400 mt-1">{t.selectProject}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                            {(['ru', 'en', 'uz'] as Language[]).map(l => (
                                <button key={l} onClick={() => onLangChange(l)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${lang === l ? 'bg-red-600 text-white' : 'text-gray-500'}`}>
                                    {l}
                                </button>
                            ))}
                        </div>
                        <button onClick={onSignOut} title={t.logout} className="p-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </header>
                <main>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <button onClick={() => setIsModalOpen(true)} className="flex flex-col items-center justify-center p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 hover:border-red-500 hover:text-red-500 transition-all duration-300 min-h-[180px]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                            <span className="mt-2 font-semibold">{t.createProject}</span>
                        </button>
                        {loading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse min-h-[180px]"></div>) : 
                            projects.map(project => (
                                <div key={project.id} onClick={() => onSelectProject(project)} className="flex flex-col justify-between bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer transform hover:-translate-y-1 hover:border-red-500/70 transition-all duration-300 shadow-lg min-h-[180px]">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-100 truncate" title={project.name}>{project.name}</h3>
                                        <p className="text-gray-400 mt-2 text-sm break-words line-clamp-2">{project.description || (lang === 'ru' ? 'Нет описания' : (lang === 'en' ? 'No description' : 'Tavsif yo\'q'))}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4 italic">
                                        {lang === 'ru' ? 'Создан' : (lang === 'en' ? 'Created' : 'Yaratilgan')}: {project.createdAt?.seconds ? new Date(project.createdAt.seconds * 1000).toLocaleDateString() : '...'}
                                    </p>
                                </div>
                            ))
                        }
                    </div>
                </main>
            </div>
            <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddProject} t={t} />
        </div>
    );
};
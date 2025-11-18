import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { Project } from './types';

interface ProjectListProps {
    user: User;
    onSelectProject: (project: Project) => void;
    onSignOut: () => void;
}

interface ProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description: string) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('Название проекта не может быть пустым');
            return;
        }
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
                <h2 className="text-2xl font-bold text-red-500 mb-6">Новый Проект</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Название Проекта</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Название вашего проекта" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Описание (необязательно)</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Краткое описание" className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500" />
                    </div>
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 transition-colors">Отмена</button>
                        <button type="submit" className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold transition-colors">Создать</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export const ProjectList: React.FC<ProjectListProps> = ({ user, onSelectProject, onSignOut }) => {
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
            alert("Ошибка при создании проекта!");
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
            <div className="container mx-auto p-4 md:p-8">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 className="text-4xl font-bold text-red-500 tracking-wider">Мои Проекты</h1>
                        <p className="text-gray-400 mt-1">Выберите проект для продолжения</p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-400 text-sm hidden md:block" title={user.email || 'user'}>{user.email}</span>
                        <button onClick={onSignOut} title="Выйти" className="p-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-lg font-semibold transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </header>

                <main>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="flex flex-col items-center justify-center p-6 bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:bg-gray-800 hover:border-red-500 hover:text-red-500 transition-all duration-300 min-h-[180px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="mt-2 font-semibold">Создать проект</span>
                        </button>

                        {loading ? (
                             Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-6 animate-pulse min-h-[180px]">
                                    <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                                    <div className="h-4 bg-gray-700 rounded w-5/6 mt-2"></div>
                                </div>
                            ))
                        ) : (
                            projects.map(project => (
                                <div 
                                    key={project.id}
                                    onClick={() => onSelectProject(project)}
                                    className="flex flex-col justify-between bg-gray-800 border border-gray-700 rounded-lg p-6 cursor-pointer transform hover:-translate-y-1 hover:border-red-500/70 transition-all duration-300 shadow-lg min-h-[180px]"
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-100 truncate" title={project.name}>{project.name}</h3>
                                        <p className="text-gray-400 mt-2 text-sm break-words">{project.description || 'Нет описания'}</p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4">Создан: {new Date(project.createdAt?.seconds * 1000).toLocaleDateString('ru-RU')}</p>
                                </div>
                            ))
                        )}
                    </div>
                     {!loading && projects.length === 0 && (
                        <div className="text-center py-16 text-gray-500 col-span-full">
                            <p>У вас еще нет проектов.</p>
                            <p>Начните с создания первого!</p>
                        </div>
                    )}
                </main>
            </div>
            <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleAddProject} />
        </div>
    );
};

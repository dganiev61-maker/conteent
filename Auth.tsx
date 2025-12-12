
import React, { useState } from 'react';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Language } from './types';
import { translations } from './translations';

interface AuthProps {
  auth: FirebaseAuth;
  onBackToLanding: () => void;
  lang: Language;
  onLangChange: (l: Language) => void;
}

const getFriendlyErrorMessage = (error: any, lang: Language): string => {
    if (error && error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                return lang === 'ru' ? 'Неверный формат email.' : (lang === 'en' ? 'Invalid email format.' : 'Email formati noto\'g\'ri.');
            case 'auth/user-not-found':
                return lang === 'ru' ? 'Пользователь не найден.' : (lang === 'en' ? 'User not found.' : 'Foydalanuvchi topilmadi.');
            default:
                return lang === 'ru' ? 'Ошибка входа.' : (lang === 'en' ? 'Auth error.' : 'Kirishda xatolik.');
        }
    }
    return 'Error';
};

export const Auth: React.FC<AuthProps> = ({ auth, onBackToLanding, lang, onLangChange }) => {
    const t = translations[lang];
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (err) {
            setError(getFriendlyErrorMessage(err, lang));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative">
            <div className="absolute top-6 left-6 flex items-center gap-4">
                <button onClick={onBackToLanding} className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {t.backToHome}
                </button>
            </div>
            
            <div className="absolute top-6 right-6">
                <div className="flex bg-gray-800 border border-gray-700 rounded-lg p-1">
                    {(['ru', 'en', 'uz'] as Language[]).map(l => (
                        <button
                            key={l}
                            onClick={() => onLangChange(l)}
                            className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                                lang === l ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-red-500 tracking-wider">{t.title}</h1>
                <p className="text-gray-400 mt-1">{t.tagline}</p>
            </div>
            
            <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">{isLogin ? t.login : t.register}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.email}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.password}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2" />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold transition-colors">
                        {loading ? '...' : (isLogin ? t.login : t.createAccount)}
                    </button>
                </form>

                <div className="relative my-6 text-center">
                    <span className="bg-gray-800 px-2 text-gray-400 text-sm">{t.or}</span>
                </div>

                <button onClick={() => signInWithPopup(auth, new GoogleAuthProvider())} className="w-full flex justify-center items-center gap-3 px-4 py-2 rounded-md bg-white text-gray-800 font-semibold hover:bg-gray-200 transition-colors">
                    {t.googleSignIn}
                </button>
                
                <p className="text-center mt-6 text-sm text-gray-400">
                    {isLogin ? t.noAccount : t.alreadyHaveAccount}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-red-500 hover:text-red-400 ml-1">
                        {isLogin ? t.signUp : t.signIn}
                    </button>
                </p>
            </div>
        </div>
    );
};

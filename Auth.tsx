import React, { useState } from 'react';
import { Auth as FirebaseAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthProps {
  auth: FirebaseAuth;
  onBackToLanding: () => void;
}

const getFriendlyErrorMessage = (error: any): string => {
    // Check for the 'code' property which is characteristic of a FirebaseError
    if (error && error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Неверный формат email.';
            case 'auth/user-not-found':
                return 'Пользователь с таким email не найден.';
            case 'auth/wrong-password':
                return 'Неверный пароль.';
            case 'auth/email-already-in-use':
                return 'Этот email уже используется.';
            case 'auth/weak-password':
                return 'Пароль должен быть не менее 6 символов.';
            case 'auth/invalid-credential':
                 return 'Неверный email или пароль.';
            case 'auth/popup-closed-by-user':
                return 'Окно входа было закрыто. Попробуйте снова.';
            default:
                return 'Произошла ошибка. Попробуйте снова.';
        }
    }
    return 'Произошла неизвестная ошибка.';
};


export const Auth: React.FC<AuthProps> = ({ auth, onBackToLanding }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

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
            setError(getFriendlyErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setGoogleLoading(true);
        try {
            await signInWithPopup(auth, new GoogleAuthProvider());
        } catch (err) {
            setError(getFriendlyErrorMessage(err));
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 relative">
            <div className="absolute top-6 left-6">
                <button 
                    onClick={onBackToLanding}
                    className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Back to Home"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    На главную
                </button>
            </div>
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-red-500 tracking-wider">Самурай Контент</h1>
                <p className="text-gray-400 mt-1">Путь контента - путь воина</p>
            </div>
            <div className="w-full max-w-sm bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-8">
                <h2 className="text-2xl font-bold text-center text-gray-200 mb-6">{isLogin ? 'Вход' : 'Регистрация'}</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="email@example.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-400 mb-1">Пароль</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="••••••••"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div>
                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className="w-full px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 font-semibold transition-colors disabled:bg-red-800 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}
                        </button>
                    </div>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-gray-800 px-2 text-gray-400">Или</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={loading || googleLoading}
                        className="w-full flex justify-center items-center gap-3 px-4 py-2 rounded-md bg-white text-gray-800 font-semibold hover:bg-gray-200 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.655-3.417-11.27-8.161l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.02,35.625,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        </svg>
                        {googleLoading ? 'Вход...' : 'Войти через Google'}
                    </button>
                </div>
                
                <p className="text-center mt-6 text-sm text-gray-400">
                    {isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="font-medium text-red-500 hover:text-red-400 ml-1"
                    >
                        {isLogin ? 'Зарегистрируйтесь' : 'Войдите'}
                    </button>
                </p>
            </div>
        </div>
    );
};

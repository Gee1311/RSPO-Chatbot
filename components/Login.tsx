import React, { useState } from 'react';
import { User, ModalType } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  onShowModal: (type: ModalType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleDemoLogin = () => {
    if (!acceptedTerms) return alert("Please accept the Terms of Service to continue.");
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'demo-123',
        name: 'Demo Auditor',
        email: 'auditor@demo.rspo.org',
        role: 'demo',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    if (!acceptedTerms) return alert("Please accept the Terms of Service to continue.");
    setIsLoading(true);
    setTimeout(() => {
      onLogin({
        id: 'google-999',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        role: 'manager',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="bg-emerald-800 dark:bg-emerald-950 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12"></div>
          
          <div className="inline-flex bg-white dark:bg-slate-100 p-4 rounded-3xl shadow-xl mb-6 relative z-10">
            <i className="fa-solid fa-seedling text-emerald-800 text-4xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-white relative z-10 tracking-tight">RSPO Chatbot</h2>
          <p className="text-emerald-200 dark:text-emerald-400 text-sm mt-2 relative z-10 font-medium">Compliance & Audit Excellence</p>
        </div>

        <div className="p-10">
          <div className="space-y-5">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 px-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] ${!acceptedTerms && 'opacity-50 grayscale'}`}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
              Sign in with Google
            </button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              <span className="flex-shrink mx-4 text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest">or access via</span>
              <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
            </div>

            <button
              onClick={handleDemoLogin}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-bold py-4 px-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] ${!acceptedTerms && 'opacity-50 grayscale'}`}
            >
              <i className="fa-solid fa-flask-vial"></i>
              Open Demo Account
            </button>

            <div className="pt-4 flex items-start gap-3">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                I accept the <button onClick={() => onShowModal('terms')} className="text-emerald-600 dark:text-emerald-500 font-bold hover:underline">Terms of Service</button> and have read the <button onClick={() => onShowModal('privacy')} className="text-emerald-600 dark:text-emerald-500 font-bold hover:underline">Privacy Policy</button>.
              </label>
            </div>
          </div>

          <p className="mt-10 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed uppercase font-bold tracking-tighter">
            Audit-grade security for RSPO certification processes
          </p>
        </div>
      </div>
      
      <div className="mt-8 flex items-center gap-8 text-[11px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
        <button onClick={() => onShowModal('contact')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-2">
          <i className="fa-solid fa-headset"></i> Support
        </button>
        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full"></span>
        <button onClick={() => onShowModal('privacy')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Privacy</button>
        <span className="w-1.5 h-1.5 bg-slate-300 dark:bg-slate-800 rounded-full"></span>
        <button onClick={() => onShowModal('terms')} className="hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">Terms</button>
      </div>
    </div>
  );
};

export default Login;
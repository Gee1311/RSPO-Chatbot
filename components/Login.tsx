
import React, { useState } from 'react';
import { User, ModalType } from '../types';
import { PLANS, NATIONAL_INTERPRETATIONS } from '../constants';

interface LoginProps {
  onLogin: (user: User) => void;
  onShowModal: (type: ModalType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedNI, setSelectedNI] = useState<string | null>(null);
  const [isNIListOpen, setIsNIListOpen] = useState(false);

  const selectedNIName = NATIONAL_INTERPRETATIONS.find(ni => ni.id === selectedNI)?.name || 'Select Regional Context';

  const handleDemoLogin = () => {
    if (!acceptedTerms) return alert("Please accept the Terms of Service to continue.");
    if (!selectedNI) return alert("Please select a National Interpretation to proceed with your audit context.");
    
    setIsLoading(true);
    const freePlan = PLANS.find(p => p.tier === 'Free')!;
    setTimeout(() => {
      onLogin({
        id: 'demo-123',
        name: 'Demo Auditor',
        email: 'auditor@demo.rspo.org',
        phone: '+60 3-2302 1500',
        address: 'Level 13A, Menara UAC, No. 12, Jalan PJU 7/5, Mutiara Damansara, 47810 Petaling Jaya, Selangor, Malaysia',
        role: 'Auditor',
        tier: 'Free',
        tokenLimit: freePlan.tokens,
        tokensUsed: 0,
        createdAt: Date.now(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        preferences: { theme: 'light', language: 'en', autoSave: true },
        notifications: { billing: true, compliance: true, system: true },
        invoices: [],
        nationalInterpretations: [selectedNI]
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleGoogleLogin = () => {
    if (!acceptedTerms) return alert("Please accept the Terms of Service to continue.");
    if (!selectedNI) return alert("Please select a National Interpretation to proceed with your audit context.");

    setIsLoading(true);
    const freePlan = PLANS.find(p => p.tier === 'Free')!;
    setTimeout(() => {
      onLogin({
        id: 'google-999',
        name: 'John Doe',
        email: 'john.doe@gmail.com',
        phone: '+62 21 2345 6789',
        address: 'Jl. Jend. Sudirman No.1, Jakarta, Indonesia',
        role: 'Compliance Manager',
        tier: 'Free',
        tokenLimit: freePlan.tokens,
        tokensUsed: 0,
        createdAt: Date.now(),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        preferences: { theme: 'light', language: 'en', autoSave: true },
        notifications: { billing: true, compliance: true, system: true },
        invoices: [],
        nationalInterpretations: [selectedNI]
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors overflow-y-auto py-12">
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

        <div className="p-8">
          {/* Step 1: National Interpretation Selection Toggle */}
          <div className="mb-8">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">
              1. Audit Regional Context
            </label>
            
            <div className="relative">
              <button
                onClick={() => setIsNIListOpen(!isNIListOpen)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  selectedNI 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900' 
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <i className={`fa-solid ${selectedNI ? 'fa-earth-asia text-emerald-600' : 'fa-location-dot'}`}></i>
                  <span className="text-xs font-bold truncate pr-2">{selectedNIName}</span>
                </div>
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform ${isNIListOpen ? 'rotate-180' : ''}`}></i>
              </button>

              {isNIListOpen && (
                <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide animate-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {NATIONAL_INTERPRETATIONS.map(ni => (
                      <button
                        key={ni.id}
                        onClick={() => {
                          setSelectedNI(ni.id);
                          setIsNIListOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                          selectedNI === ni.id 
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-100' 
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold text-left">{ni.name}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedNI === ni.id ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300 dark:border-slate-600'}`}>
                          {selectedNI === ni.id && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="mt-3 text-[9px] text-slate-400 italic px-1">
              Audit results are grounded against the selected NI documentation. Single selection enforced for session consistency.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                2. Authenticate
              </label>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold py-4 px-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] ${(!acceptedTerms || !selectedNI) && 'opacity-50 grayscale cursor-not-allowed'}`}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
                <span className="flex-shrink mx-4 text-slate-300 dark:text-slate-700 text-[10px] font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-800"></div>
              </div>

              <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 font-bold py-4 px-4 rounded-2xl transition-all shadow-sm active:scale-[0.98] ${(!acceptedTerms || !selectedNI) && 'opacity-50 grayscale cursor-not-allowed'}`}
              >
                <i className="fa-solid fa-flask-vial"></i>
                Open Demo Account
              </button>
            </div>

            <div className="pt-2 flex items-start gap-3">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 dark:text-emerald-50 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded focus:ring-emerald-500 cursor-pointer"
                />
              </div>
              <label htmlFor="terms" className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                I accept the <button onClick={() => onShowModal('terms')} className="text-emerald-600 dark:text-emerald-50 font-bold hover:underline">Terms of Service</button> and have read the <button onClick={() => onShowModal('privacy')} className="text-emerald-600 dark:text-emerald-50 font-bold hover:underline">Privacy Policy</button>.
              </label>
            </div>
          </div>

          <p className="mt-8 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed uppercase font-bold tracking-tighter">
            Default signup grants Free access (1,000 weekly tokens for 1 month)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

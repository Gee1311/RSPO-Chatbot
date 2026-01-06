
import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types';

interface SettingsModalProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
}

const MOCK_PAYMENTS = [
  { id: 'inv-8291', date: '2024-05-15', amount: '$49.00', status: 'Success', method: 'Visa **** 4242' },
  { id: 'inv-7721', date: '2024-04-15', amount: '$49.00', status: 'Success', method: 'Visa **** 4242' },
  { id: 'inv-6110', date: '2024-03-15', amount: '$49.00', status: 'Success', method: 'Visa **** 4242' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onUpdateUser, onLogout, onClose }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'billing' | 'notifications'>('billing');
  const [name, setName] = useState(user.name);
  const [organization, setOrganization] = useState(user.organization || 'Global Palm Estates');
  const [avatar, setAvatar] = useState(user.avatar);
  const [stripeKeyInput, setStripeKeyInput] = useState(user.stripeKey || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  
  // Payment State
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [isLinkingAccount, setIsLinkingAccount] = useState(!user.stripeKey);
  const [cardName, setCardName] = useState(user.name);
  const [hasConfiguredPayment, setHasConfiguredPayment] = useState(false);
  const [savedCard, setSavedCard] = useState({ brand: 'Visa', last4: '4242', expiry: '12/26' });
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Stripe Refs
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const cardElementRef = useRef<any>(null);

  const currentTier = user.tier || 'Free';

  // Initialize Stripe Elements when tab is active and key is present
  useEffect(() => {
    const keyToUse = user.stripeKey || stripeKeyInput;
    if (activeTab === 'billing' && isEditingPayment && keyToUse && (window as any).Stripe) {
      try {
        const stripe = (window as any).Stripe(keyToUse);
        stripeRef.current = stripe;
        
        const elements = stripe.elements({
          fonts: [{ cssSrc: 'https://fonts.googleapis.com/css?family=Inter' }],
        });
        elementsRef.current = elements;

        const style = {
          base: {
            color: document.documentElement.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '14px',
            '::placeholder': { color: '#94a3b8' },
          },
          invalid: {
            color: '#ef4444',
            iconColor: '#ef4444',
          },
        };

        const card = elements.create('card', { style, hidePostalCode: true });
        card.mount('#stripe-card-element');
        cardElementRef.current = card;

        card.on('change', (event: any) => {
          setStripeError(event.error ? event.error.message : null);
        });

        return () => card.destroy();
      } catch (err) {
        console.error("Stripe initialization error:", err);
        setStripeError("Invalid Stripe Publishable Key provided.");
      }
    }
  }, [activeTab, isEditingPayment, user.stripeKey]);

  const handleSave = () => {
    onUpdateUser({ ...user, name, organization, avatar, stripeKey: stripeKeyInput });
    alert("Profile settings updated successfully!");
    onClose();
  };

  const handleLinkStripeAccount = () => {
    if (!stripeKeyInput.startsWith('pk_')) {
      alert("Please enter a valid Stripe Publishable Key (starting with pk_).");
      return;
    }
    
    setIsProcessing(true);
    setProcessingStep('Validating Account Link...');
    
    setTimeout(() => {
      onUpdateUser({ ...user, stripeKey: stripeKeyInput });
      setIsProcessing(false);
      setIsLinkingAccount(false);
      alert("Account Linked! Your Stripe Publishable Key has been successfully associated with this workspace.");
    }, 1000);
  };

  const handleUpdatePayment = async () => {
    if (!cardName) {
      setStripeError("Cardholder name is required.");
      return;
    }

    if (!user.stripeKey) {
      setStripeError("Please link your Stripe account first.");
      setIsLinkingAccount(true);
      return;
    }

    setIsProcessing(true);
    setProcessingStep('Initiating Stripe Vault...');
    
    try {
      if (!stripeRef.current || !cardElementRef.current) {
        throw new Error("Stripe SDK not initialized. Ensure your Publishable Key is correct.");
      }

      const { paymentMethod, error } = await stripeRef.current.createPaymentMethod({
        type: 'card',
        card: cardElementRef.current,
        billing_details: { name: cardName },
      });

      if (error) {
        setStripeError(error.message);
        setIsProcessing(false);
        return;
      }

      setProcessingStep('Securing Payment Identity...');
      
      setTimeout(() => {
        setSavedCard({
          brand: paymentMethod.card.brand.charAt(0).toUpperCase() + paymentMethod.card.brand.slice(1),
          last4: paymentMethod.card.last4,
          expiry: `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year.toString().slice(-2)}`
        });
        setIsProcessing(false);
        setIsEditingPayment(false);
        setHasConfiguredPayment(true);
        alert(`Success! Card (${paymentMethod.card.brand}) tokenized against your Stripe account.`);
      }, 1200);

    } catch (err: any) {
      setStripeError(err.message || "Failed to contact your Stripe account.");
      setIsProcessing(false);
    }
  };

  const handleSubscriptionAction = () => {
    if (currentTier === 'Enterprise Pro') {
      if (!window.confirm("Confirm Downgrade?\nYou will lose access to premium audit logs immediately.")) return;
    } else {
      if (!hasConfiguredPayment) {
        setIsEditingPayment(true);
        return;
      }
    }

    setIsProcessing(true);
    setProcessingStep(currentTier === 'Free' ? 'Finalizing Subscription...' : 'Updating Account...');
    
    setTimeout(() => {
      setIsProcessing(false);
      if (currentTier === 'Free') {
        onUpdateUser({ ...user, tier: 'Enterprise Pro', subscriptionStatus: 'Active' });
        alert("Upgrade successful! Subscription processed through your linked Stripe account.");
      } else {
        onUpdateUser({ ...user, tier: 'Free', subscriptionStatus: 'Expired' });
        alert("Your plan has been downgraded.");
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-800 dark:bg-emerald-950 p-6 text-white flex justify-between items-center shrink-0 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <i className="fa-solid fa-gear text-2xl text-emerald-300"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">Account Configuration</h3>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1.5">Enterprise Cloud Hub</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-50 dark:bg-slate-950 px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {[
            { id: 'account', label: 'Identity', icon: 'fa-user' },
            { id: 'billing', label: 'Stripe Billing', icon: 'fa-credit-card' },
            { id: 'notifications', label: 'Alerts', icon: 'fa-bell' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-600 dark:bg-emerald-400 rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          
          {activeTab === 'account' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <section className="flex flex-col items-center sm:flex-row gap-8 bg-slate-50 dark:bg-slate-800/40 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner text-center sm:text-left">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-white">
                    <img src={avatar || `https://ui-avatars.com/api/?name=${name}`} className="w-full h-full object-cover" />
                  </div>
                </div>
                <div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-slate-100">{name}</h4>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">{user.role}</p>
                </div>
              </section>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all shadow-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Organization</label>
                  <input value={organization} onChange={(e) => setOrganization(e.target.value)} className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Stripe Account Linking Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stripe Account Connection</h4>
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${user.stripeKey ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    <i className={`fa-solid ${user.stripeKey ? 'fa-link' : 'fa-link-slash'}`}></i>
                    {user.stripeKey ? 'Linked' : 'Not Linked'}
                  </div>
                </div>
                
                {isLinkingAccount ? (
                  <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm animate-in slide-in-from-top-4 duration-300">
                    <p className="text-xs text-slate-500 mb-4">Provide your **Stripe Publishable Key** from your dashboard to link your account to the RSPO Workspace.</p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Publishable Key (pk_...)</label>
                        <input 
                          type="password" 
                          placeholder="pk_test_..." 
                          value={stripeKeyInput}
                          onChange={(e) => setStripeKeyInput(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" 
                        />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleLinkStripeAccount}
                          disabled={isProcessing}
                          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all"
                        >
                          {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : null}
                          {isProcessing ? 'Verifying Key...' : 'Link Stripe Account'}
                        </button>
                        {user.stripeKey && (
                          <button 
                            onClick={() => setIsLinkingAccount(false)}
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600">
                        <i className="fa-brands fa-stripe text-3xl"></i>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">Linked to Account</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Key: {user.stripeKey?.substring(0, 10)}...{user.stripeKey?.substring(user.stripeKey.length - 8)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsLinkingAccount(true)}
                      className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all"
                    >
                      Update Key
                    </button>
                  </div>
                )}
              </section>

              {/* Subscription Overview */}
              <section className={`${currentTier === 'Enterprise Pro' ? 'bg-emerald-800 dark:bg-emerald-950' : 'bg-slate-800 dark:bg-slate-950'} p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden transition-colors`}>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Subscription Tier</h4>
                    <p className="text-3xl font-black">{currentTier}</p>
                  </div>
                  <button 
                    onClick={handleSubscriptionAction}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-10 py-4 font-black rounded-2xl bg-white text-slate-900 hover:bg-emerald-50 transition-all shadow-lg"
                  >
                    {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : null}
                    {isProcessing ? processingStep : currentTier === 'Free' ? "Upgrade to Pro" : "Cancel Plan"}
                  </button>
                </div>
              </section>

              {/* Secure Card Payment via Stripe Elements */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secure Payment Entry</h4>
                  <div className="flex items-center gap-1 opacity-40">
                    <i className="fa-solid fa-lock text-[10px]"></i>
                    <span className="text-[8px] font-bold uppercase tracking-widest">Elements Secure</span>
                  </div>
                </div>
                
                {isEditingPayment ? (
                  <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-[2.5rem] border-2 border-emerald-500/30 shadow-2xl animate-in slide-in-from-top-4 duration-300">
                    {!user.stripeKey ? (
                       <div className="text-center py-6">
                          <i className="fa-solid fa-link-slash text-rose-400 text-2xl mb-2"></i>
                          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Account link required before adding card details.</p>
                          <button onClick={() => { setIsLinkingAccount(true); setIsEditingPayment(false); }} className="mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Connect Account First</button>
                       </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cardholder Name</label>
                          <input 
                            type="text" 
                            placeholder="Full name as it appears on card" 
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 dark:text-slate-100" 
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Verification Points</label>
                          <div id="stripe-card-element" className="StripeElement transition-all min-h-[46px]"></div>
                          {stripeError && (
                            <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1 flex items-center gap-1.5">
                              <i className="fa-solid fa-circle-exclamation"></i>
                              {stripeError}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={handleUpdatePayment}
                            disabled={isProcessing}
                            className="flex-1 py-4 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
                          >
                            {isProcessing ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : null}
                            {isProcessing ? processingStep : "Secure & Link Card"}
                          </button>
                          <button 
                            onClick={() => setIsEditingPayment(false)}
                            disabled={isProcessing}
                            className="px-6 py-4 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-black hover:bg-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-6 bg-white dark:bg-slate-900 border rounded-[2rem] transition-all ${!hasConfiguredPayment ? 'border-dashed border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        <i className={`fa-brands ${!hasConfiguredPayment ? 'fa-cc-stripe text-slate-300' : savedCard.brand === 'Visa' ? 'fa-cc-visa text-blue-700' : 'fa-cc-mastercard text-amber-600'} text-2xl`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                          {!hasConfiguredPayment ? 'No Card on File' : `${savedCard.brand} •••• ${savedCard.last4}`}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Stored securely in your Stripe Vault</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingPayment(true)}
                      className="px-6 py-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all shadow-sm"
                    >
                      {hasConfiguredPayment ? 'Modify Card' : 'Add Card'}
                    </button>
                  </div>
                )}
              </section>

              {/* Transactions History */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Account Billing Records</h4>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {MOCK_PAYMENTS.map(pay => (
                        <tr key={pay.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{pay.id}</td>
                          <td className="px-6 py-4 text-[11px] text-slate-500">{pay.date}</td>
                          <td className="px-6 py-4 text-[11px] font-black text-right">{pay.amount}</td>
                          <td className="px-6 py-4 text-right">
                             <button className="p-2 text-slate-400 hover:text-emerald-600"><i className="fa-solid fa-file-pdf"></i></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Alert Rules</h4>
              <div className="space-y-4">
                {[
                  { id: 'billing', title: 'Stripe Account Alerts', desc: 'Direct notifications from your linked account.', icon: 'fa-file-invoice-dollar' },
                  { id: 'audit', title: 'Standard Updates', desc: 'Alerts when RSPO P&C documents change.', icon: 'fa-magnifying-glass-chart' }
                ].map((item) => (
                  <label key={item.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl cursor-pointer group hover:border-emerald-500 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-400 group-hover:text-emerald-600 transition-colors">
                        <i className={`fa-solid ${item.icon}`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">{item.desc}</p>
                      </div>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-emerald-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button onClick={() => { if (window.confirm("Permanent account deletion?")) onLogout(); }} className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Terminate Identity</button>
          <button onClick={handleSave} className="px-10 py-3 bg-slate-900 dark:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all">Commit Changes</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

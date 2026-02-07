
import React, { useState, useEffect } from 'react';
import { User, UserTier, Invoice } from '../types';
import { PLANS } from '../constants';

interface PaymentGatewayProps {
  user: User;
  onPaymentSuccess: (newTier: UserTier, tokens: number, invoice: Invoice) => void;
  onClose: () => void;
  initialTier?: UserTier;
}

type PaymentMethod = 'visa' | 'mastercard' | 'paypal' | 'credit';
type PaymentStep = 'method' | 'details' | 'bank_redirect' | 'paypal_portal' | 'processing' | 'success';

const ENTERPRISE_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 1000000);

const PaymentGateway: React.FC<PaymentGatewayProps> = ({ user, onPaymentSuccess, onClose, initialTier }) => {
  const [step, setStep] = useState<PaymentStep>('method');
  const [method, setMethod] = useState<PaymentMethod>('visa');
  const [selectedTier, setSelectedTier] = useState<UserTier>(initialTier || 'Starter');
  const [enterpriseTokens, setEnterpriseTokens] = useState(user.tier === 'Enterprise' ? user.tokenLimit : 1000000);
  const [showBenefitsFor, setShowBenefitsFor] = useState<UserTier | null>(null);
  
  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // PayPal Input
  const [paypalEmail, setPaypalEmail] = useState(user.email || '');

  const calculateEnterprisePrice = (tokens: number) => `$${(tokens / 1000000) * 50}.00`;
  
  const currentPlan = PLANS.find(p => p.tier === selectedTier);
  const currentPrice = selectedTier === 'Enterprise' ? calculateEnterprisePrice(enterpriseTokens) : (currentPlan?.price || '$0');
  const currentTokens = selectedTier === 'Enterprise' ? enterpriseTokens : (currentPlan?.tokens || 0);

  const handleNext = () => {
    if (step === 'method') {
      if (method === 'paypal') {
        setStep('paypal_portal');
      } else {
        setStep('details');
      }
    } else if (step === 'details') {
      setStep('bank_redirect');
    }
  };

  const handlePaymentComplete = () => {
    if (method === 'paypal' && !paypalEmail.includes('@')) {
      alert("Please enter a valid PayPal account email.");
      return;
    }
    setStep('processing');
    setTimeout(() => {
      const invoice: Invoice = {
        id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
        date: new Date().toISOString().split('T')[0],
        amount: currentPrice,
        status: 'Paid',
        billingPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        tokens: currentTokens,
        paymentMethod: method.toUpperCase()
      };
      setStep('success');
      setTimeout(() => {
        onPaymentSuccess(selectedTier, currentTokens, invoice);
      }, 2000);
    }, 2500);
  };

  const formatCardNumber = (val: string) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : v;
  };

  const getProviderBrand = () => {
    switch (method) {
      case 'mastercard': return { name: 'Mastercard ID Check', color: 'text-orange-500' };
      case 'visa': return { name: 'Verified by VISA', color: 'text-blue-600' };
      case 'paypal': return { name: 'PayPal Secure Pay', color: 'text-blue-800' };
      default: return { name: 'Secure 3D Auth', color: 'text-slate-600' };
    }
  };

  const toggleBenefits = (e: React.MouseEvent, tier: UserTier) => {
    e.stopPropagation();
    setShowBenefitsFor(showBenefitsFor === tier ? null : tier);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300 border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <header className="bg-slate-900 dark:bg-black p-6 text-white flex justify-between items-center shrink-0 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <i className="fa-solid fa-shield-halved text-white text-lg"></i>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight uppercase leading-none">Checkout Workspace</h3>
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-[0.2em] mt-1">Bank-Endorsed Gateway</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </header>

        <div className="p-8 flex-1 overflow-y-auto scrollbar-hide">
          
          {step === 'method' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">1. Selected Intelligence Pack</label>
                <div className="space-y-3">
                  {PLANS.filter(p => p.tier !== 'Free').map(plan => (
                    <div key={plan.tier} className="space-y-2">
                      <button 
                        onClick={() => setSelectedTier(plan.tier)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between group relative ${selectedTier === plan.tier ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-200'}`}
                      >
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedTier === plan.tier ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                             <i className={`fa-solid ${plan.tier === 'Enterprise' ? 'fa-building-shield' : 'fa-bolt-lightning'}`}></i>
                           </div>
                           <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{plan.tier} Pack</p>
                                <button 
                                  onClick={(e) => toggleBenefits(e, plan.tier)}
                                  className={`text-[10px] p-1 rounded-full transition-colors ${showBenefitsFor === plan.tier ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-emerald-500'}`}
                                  title="View Benefits"
                                >
                                  <i className={`fa-solid ${showBenefitsFor === plan.tier ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
                                </button>
                              </div>
                              <p className="text-[9px] text-slate-500 font-bold">{plan.tier === 'Enterprise' ? enterpriseTokens.toLocaleString() : plan.tokens.toLocaleString()} Tokens</p>
                           </div>
                        </div>
                        <span className="text-sm font-black text-emerald-600">
                          {plan.tier === 'Enterprise' ? calculateEnterprisePrice(enterpriseTokens) : plan.price}
                        </span>
                      </button>

                      {/* Expandable Benefits Area */}
                      {showBenefitsFor === plan.tier && (
                        <div className="px-5 py-4 bg-emerald-100/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                          <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-2">Package Benefits:</p>
                          <ul className="space-y-1.5">
                            {plan.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                                <i className="fa-solid fa-check text-emerald-500 mt-0.5 shrink-0"></i>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {selectedTier === 'Enterprise' && (
                  <div className="mt-4 animate-in slide-in-from-top-2">
                    <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2 block">Enterprise Capacity Scaling</label>
                    <select 
                      value={enterpriseTokens} 
                      onChange={(e) => setEnterpriseTokens(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {ENTERPRISE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toLocaleString()} Tokens - {calculateEnterprisePrice(opt)}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">2. Payment Provider</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'visa', icon: 'fa-brands fa-cc-visa', color: 'text-blue-600' },
                    { id: 'mastercard', icon: 'fa-brands fa-cc-mastercard', color: 'text-orange-500' },
                    { id: 'paypal', icon: 'fa-brands fa-paypal', color: 'text-blue-800' },
                    { id: 'credit', icon: 'fa-solid fa-credit-card', color: 'text-slate-600' }
                  ].map(p => (
                    <button 
                      key={p.id}
                      onClick={() => setMethod(p.id as PaymentMethod)}
                      className={`py-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${method === p.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-slate-300'}`}
                    >
                      <i className={`${p.icon} text-2xl ${method === p.id ? 'text-white' : p.color}`}></i>
                      <span className="text-[8px] font-black uppercase tracking-widest">{p.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-5 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
              >
                {method === 'paypal' ? 'Proceed with PayPal' : 'Continue to Secure Entry'}
              </button>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setStep('method')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-emerald-600 flex items-center gap-2">
                  <i className="fa-solid fa-arrow-left"></i> Adjust Plan
                </button>
                <div className="flex items-center gap-2">
                  <i className={`fa-brands fa-cc-${method === 'credit' ? 'visa' : method} text-2xl text-slate-900 dark:text-white`}></i>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{method} Mode</span>
                </div>
              </div>

              {/* Virtual Card View */}
              <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-110"></div>
                <div className="relative z-10 space-y-8">
                   <div className="flex justify-between items-center">
                      <div className="w-12 h-10 bg-gradient-to-br from-amber-400 to-amber-200 rounded-lg shadow-inner"></div>
                      <i className="fa-solid fa-wifi rotate-90 text-xl opacity-30"></i>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40">Secure Card Number</p>
                      <p className="text-xl font-mono tracking-widest">{cardNumber || '•••• •••• •••• ••••'}</p>
                   </div>
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Card Holder</p>
                        <p className="text-[11px] font-black uppercase tracking-widest truncate max-w-[150px]">{cardName || 'FULL NAME'}</p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Expires</p>
                        <p className="text-[11px] font-black">{expiry || 'MM/YY'}</p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cardholder Full Name</label>
                    <input 
                      type="text" 
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="NAME AS PRINTED ON CARD"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber}
                      maxLength={19}
                      onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition-all text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Expiry Date</label>
                      <input 
                        type="text" 
                        value={expiry}
                        maxLength={5}
                        onChange={e => {
                          let val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2);
                          setExpiry(val);
                        }}
                        placeholder="MM/YY"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Security Code</label>
                      <input 
                        type="password" 
                        value={cvv}
                        maxLength={4}
                        onChange={e => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="•••"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={handleNext}
                  disabled={!cardName || cardNumber.length < 19 || expiry.length < 5 || cvv.length < 3}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-30"
                >
                  Verify via Secure Bank Link
                </button>
              </div>
            </div>
          )}

          {step === 'paypal_portal' && (
            <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 py-4 flex flex-col items-center">
              <div className="w-full bg-[#f7f8f9] dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 flex flex-col items-center shadow-inner">
                <i className="fa-brands fa-paypal text-6xl text-[#003087] dark:text-blue-400 mb-6"></i>
                <div className="text-center space-y-4 w-full">
                  <div>
                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">PayPal Authorization</h4>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">External Payment Protocol</p>
                  </div>
                  
                  <div className="py-5 border-t border-b border-slate-200 dark:border-slate-700 space-y-5 w-full">
                    <div className="flex justify-between items-center gap-10">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Payee:</span>
                      <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tighter bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg">RSPO Intelligence Hub</span>
                    </div>
                    
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Your PayPal Email</label>
                       <input 
                        type="email" 
                        value={paypalEmail}
                        onChange={e => setPaypalEmail(e.target.value)}
                        placeholder="account@example.com"
                        className="w-full px-5 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
                       />
                    </div>

                    <div className="flex justify-between items-center gap-10 pt-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Total:</span>
                      <span className="text-2xl font-black text-[#003087] dark:text-blue-400">{currentPrice}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full space-y-3">
                <button 
                  onClick={handlePaymentComplete}
                  disabled={!paypalEmail.includes('@')}
                  className="w-full py-5 bg-[#0070ba] hover:bg-[#003087] text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  <i className="fa-brands fa-paypal"></i>
                  Sign In and Pay with PayPal
                </button>
                <button 
                  onClick={() => setStep('method')}
                  className="w-full py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Return to Method Selection
                </button>
              </div>

              <div className="flex items-center gap-2 opacity-40">
                <i className="fa-solid fa-lock text-[8px]"></i>
                <span className="text-[8px] font-black uppercase tracking-widest">Encrypted PayPal Session</span>
              </div>
            </div>
          )}

          {step === 'bank_redirect' && (
            <div className="space-y-10 animate-in zoom-in duration-300 py-8 text-center">
               <div className="space-y-4">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-[2rem] flex items-center justify-center text-blue-600 mx-auto border-2 border-blue-200 dark:border-blue-800 shadow-xl shadow-blue-500/10">
                    <i className="fa-solid fa-building-columns text-4xl"></i>
                  </div>
                  <h4 className={`text-2xl font-black uppercase tracking-tight ${getProviderBrand().color}`}>
                    {getProviderBrand().name}
                  </h4>
                  <p className="text-xs text-slate-500 px-10 leading-relaxed font-medium">
                    You are being securely redirected to your financial institution's portal to finalize this transaction.
                  </p>
               </div>

               <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-inner space-y-6">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting External Authorization</p>
                    <button 
                      onClick={handlePaymentComplete}
                      className="w-full py-5 bg-emerald-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      <i className="fa-solid fa-mobile-screen-button"></i>
                      Confirm in Bank App
                    </button>
                    <p className="text-[9px] text-slate-400 italic">Please use your mobile device or bank-issued token to approve the payment of {currentPrice}.</p>
                  </div>
               </div>

               <div className="flex items-center justify-center gap-6 opacity-40">
                  <i className="fa-brands fa-cc-visa text-2xl"></i>
                  <i className="fa-brands fa-cc-mastercard text-2xl"></i>
                  <i className="fa-solid fa-shield-check text-xl"></i>
               </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-20 text-center space-y-6 animate-in fade-in duration-500">
               <div className="w-20 h-20 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
               <div>
                  <h4 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Authorizing...</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest animate-pulse mt-2">Received Confirmation from Issuer</p>
               </div>
               <p className="text-xs text-slate-500 italic px-10">Updating your intelligence workspace. Please do not refresh.</p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center space-y-8 animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-emerald-400">
                  <i className="fa-solid fa-check text-4xl text-white"></i>
               </div>
               <div>
                  <h4 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Transaction Verified</h4>
                  <p className="text-emerald-600 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Tokens Successfully Dispatched</p>
               </div>
               <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-2 shadow-inner">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Audit Receipt</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{currentTokens.toLocaleString()} Refill Pack</p>
                  <p className="text-xs font-bold text-emerald-600">{currentPrice} Settled via {method.toUpperCase()}</p>
               </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {(step === 'method' || step === 'details') && (
          <footer className="p-6 bg-slate-50 dark:bg-black border-t border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
             <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
                <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-1">{currentPrice}</p>
             </div>
             <div className="flex items-center gap-2">
                <i className="fa-solid fa-lock text-emerald-600 text-xs"></i>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Secure Handshake v9.4</span>
             </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default PaymentGateway;

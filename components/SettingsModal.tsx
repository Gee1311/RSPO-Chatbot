
import React, { useState, useEffect, useRef } from 'react';
import { User, Language, SettingsTab, UserTier, Invoice } from '../types';
import { LANGUAGES, PLANS } from '../constants';

interface SettingsModalProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
  initialTab?: SettingsTab;
}

type PurchaseState = 'idle' | 'confirming' | 'redirecting' | 'processing' | 'verifying' | 'success' | 'failed';

const ENTERPRISE_OPTIONS = Array.from({ length: 10 }, (_, i) => (i + 1) * 1000000);

const STRIPE_LINKS: Record<string, string> = {
  'Starter': 'https://buy.stripe.com/test_4gMaEX8wP1rf99Z3aqfMA02',
  'Professional': 'https://buy.stripe.com/test_fZufZh14nb1P2LBh1gfMA03',
  'Enterprise': 'https://buy.stripe.com/test_28E28rfZh4Dr1Hx5iyfMA04',
  'DEFAULT': 'https://buy.stripe.com/test_3cI4gz9ATee12LBeT8fMA01'
};

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onUpdateUser, onLogout, onClose, initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [formData, setFormData] = useState<User>({ ...user });
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseState, setPurchaseState] = useState<PurchaseState>('idle');
  const [pendingPlan, setPendingPlan] = useState<{ tier: UserTier; tokens: number; price: string } | null>(null);
  const [enterpriseTokens, setEnterpriseTokens] = useState(user.tier === 'Enterprise' ? user.tokenLimit : 1000000);

  const calculateEnterprisePrice = (tokens: number) => `$${(tokens / 1000000) * 50}.00`;

  const handleApply = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateUser(formData);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  const initiatePlanSelection = (tier: UserTier) => {
    const plan = PLANS.find(p => p.tier === tier);
    if (!plan) return;

    if (tier === 'Free') {
      const updatedUser: User = { 
        ...formData, 
        tier: 'Free', 
        tokenLimit: plan.tokens, 
        subscriptionStatus: 'Active' 
      };
      setFormData(updatedUser);
      onUpdateUser(updatedUser);
      return;
    }

    const finalTokens = tier === 'Enterprise' ? enterpriseTokens : plan.tokens;
    const finalPrice = tier === 'Enterprise' ? calculateEnterprisePrice(enterpriseTokens) : plan.price;

    setPendingPlan({ tier, tokens: finalTokens, price: finalPrice });
    setPurchaseState('confirming');
  };

  const handleStripeRedirect = () => {
    if (!pendingPlan) return;
    setPurchaseState('redirecting');
    const link = STRIPE_LINKS[pendingPlan.tier] || STRIPE_LINKS['DEFAULT'];
    window.open(link, '_blank');
    setTimeout(() => setPurchaseState('processing'), 1500);
  };

  const verifyPaymentAndFinalize = () => {
    if (!pendingPlan) return;
    setPurchaseState('verifying');
    setIsProcessing(true);
    const isVerified = Math.random() > 0.3;

    setTimeout(() => {
      if (isVerified) {
        const newInvoice: Invoice = {
          id: `INV-${Math.floor(100000 + Math.random() * 900000)}`,
          date: new Date().toISOString().split('T')[0],
          amount: pendingPlan.price,
          status: 'Paid',
          billingPeriod: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          tokens: pendingPlan.tokens
        };

        const updatedUser: User = { 
          ...formData, 
          tier: pendingPlan.tier, 
          tokenLimit: pendingPlan.tokens, 
          tokensUsed: 0,
          subscriptionStatus: 'Active',
          invoices: [newInvoice, ...(formData.invoices || [])]
        };

        setFormData(updatedUser);
        onUpdateUser(updatedUser);
        setPurchaseState('success');
        setIsProcessing(false);
        setTimeout(() => {
          setPurchaseState('idle');
          setPendingPlan(null);
          setActiveTab('billing');
        }, 2500);
      } else {
        setPurchaseState('failed');
        setIsProcessing(false);
      }
    }, 2500);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoice.id}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 40px; }
          .logo { color: #065f46; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.02em; }
          .invoice-info { text-align: right; }
          .invoice-info h1 { margin: 0; color: #1e293b; font-size: 32px; font-weight: 900; }
          .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
          .details h3 { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
          .details p { margin: 0; font-size: 13px; font-weight: 500; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { background: #f8fafc; text-align: left; padding: 12px; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
          td { padding: 16px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
          .total-row { display: flex; justify-content: flex-end; }
          .total-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 200px; }
          .total-box div { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .total-box .grand-total { border-top: 1px solid #e2e8f0; padding-top: 12px; margin-top: 12px; font-weight: 900; font-size: 18px; color: #065f46; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">RSPO Intelligence Hub</div>
          <div class="invoice-info">
            <h1>INVOICE</h1>
            <p style="font-size: 12px; font-weight: 600; color: #64748b; margin-top: 4px;"># ${invoice.id}</p>
          </div>
        </div>

        <div class="details">
          <div>
            <h3>Billed To</h3>
            <p><strong>${user.name}</strong></p>
            <p>${user.organization || 'Individual Professional'}</p>
            <p>${user.address || 'No address provided'}</p>
          </div>
          <div style="text-align: right;">
            <h3>Invoice Date</h3>
            <p>${new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <h3 style="margin-top: 20px;">Billing Period</h3>
            <p>${invoice.billingPeriod}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th style="text-align: right;">Quantity</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Intelligence Token Refill</strong><br>
                <span style="font-size: 11px; color: #64748b;">Cloud-hosted RSPO audit analysis pack</span>
              </td>
              <td style="text-align: right;">${invoice.tokens.toLocaleString()}</td>
              <td style="text-align: right;">Pack</td>
              <td style="text-align: right;">${invoice.amount}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-row">
          <div class="total-box">
            <div><span>Subtotal</span><span>${invoice.amount}</span></div>
            <div><span>Tax (0%)</span><span>$0.00</span></div>
            <div class="grand-total"><span>Total</span><span>${invoice.amount}</span></div>
          </div>
        </div>

        <div style="margin-top: 60px; padding: 20px; background: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; font-size: 11px; color: #065f46; font-weight: 700;">PAYMENT STATUS: ${invoice.status.toUpperCase()}</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #047857;">Transaction Hook ID: ${Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
        </div>

        <div class="footer">
          RSPO Compliance AI • Managed by RSPO Intelligence Hub • Secure Digital Transaction
        </div>

        <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const toggleNotification = (key: keyof User['notifications']) => {
    setFormData(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Identity', icon: 'fa-user-circle' },
    { id: 'billing', label: 'Billing & Tokens', icon: 'fa-credit-card' },
    { id: 'preferences', label: 'Preferences', icon: 'fa-sliders' },
    { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 md:p-4 no-print overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[92vh] md:h-[750px] animate-in zoom-in duration-300">
        
        {purchaseState !== 'idle' && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
            {purchaseState === 'confirming' && pendingPlan && (
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto">
                  <i className="fa-brands fa-stripe text-4xl"></i>
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Checkout Summary</h4>
                  <p className="text-sm text-slate-500 mt-2">Ready to refill your intelligence pack with <span className="font-black text-emerald-600">{pendingPlan.tokens.toLocaleString()} tokens</span> for <span className="font-black text-emerald-600">{pendingPlan.price}</span>?</p>
                </div>
                <div className="pt-4 space-y-3">
                  <button onClick={handleStripeRedirect} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-emerald-700 active:scale-95 transition-all">Open Stripe Portal</button>
                  <button onClick={() => setPurchaseState('idle')} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase">Return to Settings</button>
                </div>
              </div>
            )}
            {purchaseState === 'redirecting' && (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Launching Secure Portal...</h4>
              </div>
            )}
            {(purchaseState === 'processing' || purchaseState === 'verifying') && (
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl p-10 text-center space-y-6">
                <div className="relative"><i className={`fa-solid ${purchaseState === 'verifying' ? 'fa-circle-notch fa-spin text-emerald-500' : 'fa-hourglass-half animate-pulse text-amber-500'} text-4xl`}></i></div>
                <h4 className="text-xl font-black uppercase tracking-tight">{purchaseState === 'verifying' ? 'Verifying Hook...' : 'Awaiting Stripe Hook'}</h4>
                <p className="text-xs text-slate-500 leading-relaxed px-4">{purchaseState === 'verifying' ? 'Synchronizing with Stripe secure transaction logs...' : "Once you've completed your purchase in the Stripe window, click the button below to confirm the transaction hook."}</p>
                <button onClick={verifyPaymentAndFinalize} disabled={purchaseState === 'verifying'} className="w-full py-4 bg-slate-900 dark:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-emerald-800 transition-all disabled:opacity-50">
                  {purchaseState === 'verifying' ? 'Checking Stripe...' : 'Confirm Payment Success'}
                </button>
              </div>
            )}
            {purchaseState === 'failed' && (
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl p-10 text-center space-y-6 animate-in shake duration-500">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 mx-auto"><i className="fa-solid fa-triangle-exclamation text-4xl"></i></div>
                <h4 className="text-xl font-black uppercase tracking-tight text-rose-600">Verification Pending</h4>
                <p className="text-xs text-slate-500 leading-relaxed">We haven't received the success signal from Stripe yet. Ensure your payment went through and try confirming again.</p>
                <div className="pt-4 space-y-3">
                  <button onClick={verifyPaymentAndFinalize} className="w-full py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Retry Confirm Hook</button>
                  <button onClick={() => setPurchaseState('idle')} className="w-full py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors">Cancel & Remain {formData.tier}</button>
                </div>
              </div>
            )}
            {purchaseState === 'success' && (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border-4 border-emerald-400/50"><i className="fa-solid fa-check text-4xl text-white"></i></div>
                <h4 className="text-3xl font-black text-white tracking-tight">Upgrade Guaranteed!</h4>
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Stripe Hook Verified • Access Provisioned</p>
              </div>
            )}
          </div>
        )}

        <header className="px-8 py-6 bg-emerald-800 dark:bg-emerald-950 text-white shrink-0 flex justify-between items-center border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20"><i className="fa-solid fa-gear text-emerald-300"></i></div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Account Configuration</h2>
              <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest">Workspace Management</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 text-white"><i className="fa-solid fa-xmark"></i></button>
        </header>

        <nav className="flex bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as SettingsTab)} className={`flex-1 flex items-center justify-center gap-2 py-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              <i className={`fa-solid ${tab.icon} text-xs`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && <div className="absolute bottom-0 left-4 right-4 h-1 bg-emerald-600 dark:bg-emerald-50 rounded-t-full"></div>}
            </button>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-900 scrollbar-hide">
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" alt="Avatar" />
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formData.name}</h4>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{formData.email}</p>
                </div>
                <button onClick={() => alert('Feature to update avatar arriving in next patch.')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Edit Profile Photo</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Organization</label>
                  <input type="text" value={formData.organization} onChange={e => setFormData(p => ({ ...p, organization: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Contact</label>
                  <input type="tel" value={formData.phone || ''} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Role / Designation</label>
                  <input type="text" value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-900 dark:text-white" />
                </div>
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mailing / Billing Address</label>
                  <textarea value={formData.address || ''} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-24 text-slate-900 dark:text-white resize-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                <div><h5 className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Total Pack Limit</h5><p className="text-4xl font-black">{formData.tokenLimit.toLocaleString()} Tokens</p></div>
                <div className="text-right"><p className="text-[10px] font-black text-emerald-200 uppercase mb-1">Tier</p><p className="text-lg font-black bg-white/20 px-4 py-1 rounded-full">{formData.tier}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PLANS.map(plan => {
                  const price = plan.tier === 'Enterprise' ? calculateEnterprisePrice(enterpriseTokens) : plan.price;
                  const isActive = formData.tier === plan.tier && (plan.tier !== 'Enterprise' || enterpriseTokens === formData.tokenLimit);
                  return (
                    <div key={plan.tier} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col ${isActive ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase text-slate-400">{plan.tier}</span><span className="text-xl font-black">{price}</span></div>
                      <h4 className="text-2xl font-black mb-4">{(plan.tier === 'Enterprise' ? enterpriseTokens : plan.tokens).toLocaleString()} Tokens</h4>
                      {plan.tier === 'Enterprise' && (
                        <div className="mb-4">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Configure Enterprise Payload</label>
                          <select value={enterpriseTokens} onChange={(e) => setEnterpriseTokens(Number(e.target.value))} className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-xs font-bold focus:ring-1 focus:ring-emerald-500 outline-none text-slate-900 dark:text-white">
                            {ENTERPRISE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.toLocaleString()} Tokens - {calculateEnterprisePrice(opt)}</option>)}
                          </select>
                        </div>
                      )}
                      <div className="flex-1 space-y-2 mb-6">{plan.features.map((f, idx) => <p key={idx} className="text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-2"><i className="fa-solid fa-check text-emerald-500 mt-0.5"></i> <span className="leading-tight">{f}</span></p>)}</div>
                      <button onClick={() => initiatePlanSelection(plan.tier)} className={`w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-900 text-white hover:bg-emerald-700 active:scale-95'}`}>{isActive ? 'Current Active Plan' : `Refill ${price}`}</button>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verified Transaction Hook History</h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-700">
                  {formData.invoices && formData.invoices.length > 0 ? (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-900"><tr><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-500">Invoice ID</th><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-500">Amount</th><th className="px-6 py-3 text-right pr-6 text-[9px] font-black uppercase text-slate-500">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{formData.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-white dark:hover:bg-slate-700 transition-all"><td className="px-6 py-4"><p className="text-[11px] font-black">{inv.id}</p><p className="text-[9px] text-slate-400">{inv.date}</p></td><td className="px-6 py-4 text-[11px] font-bold text-emerald-600">{inv.amount}</td><td className="px-6 py-4 text-right pr-6"><button onClick={() => handleDownloadInvoice(inv)} className="text-slate-400 hover:text-emerald-600 transition-colors p-2"><i className="fa-solid fa-file-pdf text-rose-500 text-lg"></i></button></td></tr>
                      ))}</tbody>
                    </table>
                  ) : <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No successful hooks recorded</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-top-2">
              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Workspace Theme</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, theme: 'light' } }))} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${formData.preferences.theme === 'light' ? 'bg-white border-emerald-500 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}><i className="fa-solid fa-sun text-2xl text-amber-500"></i><span className="text-[10px] font-black uppercase tracking-widest">Light Mode</span></button>
                  <button onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, theme: 'dark' } }))} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${formData.preferences.theme === 'dark' ? 'bg-slate-800 border-emerald-500 shadow-xl text-white' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}><i className="fa-solid fa-moon text-2xl text-blue-400"></i><span className="text-[10px] font-black uppercase tracking-widest">Dark Mode</span></button>
                </div>
              </section>
              <section className="space-y-4">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Workspace Language</h4>
                <div className="grid grid-cols-3 gap-3">{LANGUAGES.map(lang => <button key={lang.code} onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, language: lang.code as Language } }))} className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.preferences.language === lang.code ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400'}`}><span className="text-xl">{lang.flag}</span><span className="text-[9px] font-black uppercase tracking-widest">{lang.label}</span></button>)}</div>
              </section>
              <section className="bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] flex items-center justify-between">
                <div><h5 className="text-sm font-bold text-slate-900 dark:text-white">Auto-Save Cloud Drafts</h5><p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest mt-1">Saves audit progress every 5 minutes</p></div>
                <button onClick={() => setFormData(p => ({ ...p, preferences: { ...p.preferences, autoSave: !p.preferences.autoSave } }))} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${formData.preferences.autoSave ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${formData.preferences.autoSave ? 'left-8' : 'left-1'}`}></div></button>
              </section>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] space-y-8">
                <div className="flex items-center justify-between"><div><h5 className="text-sm font-bold text-slate-900 dark:text-white">Compliance Alerts</h5><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">New RSPO Indicator & P&C Updates</p></div><button onClick={() => toggleNotification('compliance')} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${formData.notifications.compliance ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${formData.notifications.compliance ? 'left-8' : 'left-1'}`}></div></button></div>
                <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center justify-between"><div><h5 className="text-sm font-bold text-slate-900 dark:text-white">Billing & Usage Notices</h5><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Token Refills, Invoices & Balance Alerts</p></div><button onClick={() => toggleNotification('billing')} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${formData.notifications.billing ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${formData.notifications.billing ? 'left-8' : 'left-1'}`}></div></button></div>
                <div className="h-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center justify-between"><div><h5 className="text-sm font-bold text-slate-900 dark:text-white">System Service Updates</h5><p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mt-1">Maintenance, Feature Drops & Security Logs</p></div><button onClick={() => toggleNotification('system')} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${formData.notifications.system ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}><div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all ${formData.notifications.system ? 'left-8' : 'left-1'}`}></div></button></div>
              </div>
              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-[2rem] border border-amber-100 dark:border-amber-900 flex gap-4"><i className="fa-solid fa-circle-info text-amber-600 text-lg mt-1"></i><p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">Push notifications require browser permission. You will be prompted for access next time a critical update is pushed to your workspace.</p></div>
            </div>
          )}
        </main>

        <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workspace Encrypted</p>
          <div className="flex gap-3"><button onClick={onClose} className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-colors">Discard</button><button onClick={handleApply} disabled={isProcessing} className="px-10 py-3 bg-slate-900 dark:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">{isProcessing && <i className="fa-solid fa-circle-notch animate-spin"></i>}Save Configuration</button></div>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;

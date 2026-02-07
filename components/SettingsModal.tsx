
import React, { useState } from 'react';
import { User, Language, SettingsTab, UserTier, Invoice } from '../types';
import { LANGUAGES, PLANS, NATIONAL_INTERPRETATIONS } from '../constants';

interface SettingsModalProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
  onClose: () => void;
  initialTab?: SettingsTab;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ user, onUpdateUser, onLogout, onClose, initialTab = 'profile' }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [formData, setFormData] = useState<User>({ ...user });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApply = () => {
    setIsProcessing(true);
    setTimeout(() => {
      onUpdateUser(formData);
      setIsProcessing(false);
      onClose();
    }, 600);
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
          <p style="margin: 0; font-size: 11px; color: #065f46; font-weight: 700;">PAYMENT STATUS: PAID</p>
          <p style="margin: 4px 0 0 0; font-size: 10px; color: #047857;">Provider: ${invoice.paymentMethod || 'VISA SECURE HUB'}</p>
        </div>
        <div class="footer">RSPO Compliance AI • Managed by RSPO Intelligence Hub • Secure Digital Transaction</div>
        <script>window.onload = () => { setTimeout(() => window.print(), 500); };</script>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
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
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-full max-h-[92vh] md:h-[750px] animate-in zoom-in duration-300">
        
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
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl">
                <div><h5 className="text-[10px] font-black text-emerald-200 uppercase tracking-widest mb-1">Total Intelligence Limit</h5><p className="text-4xl font-black">{formData.tokenLimit.toLocaleString()} Tokens</p></div>
                <div className="text-right"><p className="text-[10px] font-black text-emerald-200 uppercase mb-1">Active Tier</p><p className="text-lg font-black bg-white/20 px-4 py-1 rounded-full">{formData.tier}</p></div>
              </div>
              
              <div className="flex flex-col gap-4">
                 <button 
                  onClick={() => { onClose(); (window as any).dispatchEvent(new CustomEvent('open-payment-modal')); }}
                  className="w-full py-6 bg-slate-900 dark:bg-emerald-700 text-white rounded-[2rem] shadow-2xl flex flex-col items-center justify-center gap-2 hover:scale-[1.01] transition-all group border-2 border-emerald-500/20"
                 >
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-all">
                      <i className="fa-solid fa-credit-card text-2xl text-emerald-400"></i>
                   </div>
                   <div className="text-center">
                     <p className="text-xs font-black uppercase tracking-widest">Open Secure Payment Gateway</p>
                     <p className="text-[9px] font-bold text-white/50 uppercase tracking-tighter mt-1">VISA • Mastercard • PayPal • SECURE PIN</p>
                   </div>
                 </button>
              </div>

              <div className="pt-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verified Transaction Records</h4>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-slate-700">
                  {formData.invoices && formData.invoices.length > 0 ? (
                    <table className="w-full text-left">
                      <thead className="bg-slate-100 dark:bg-slate-900"><tr><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-500">Invoice ID</th><th className="px-6 py-3 text-[9px] font-black uppercase text-slate-500">Amount</th><th className="px-6 py-3 text-right pr-6 text-[9px] font-black uppercase text-slate-500">Action</th></tr></thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">{formData.invoices.map(inv => (
                        <tr key={inv.id} className="hover:bg-white dark:hover:bg-slate-700 transition-all"><td className="px-6 py-4"><p className="text-[11px] font-black">{inv.id}</p><p className="text-[9px] text-slate-400">{inv.date} ({inv.paymentMethod})</p></td><td className="px-6 py-4 text-[11px] font-bold text-emerald-600">{inv.amount}</td><td className="px-6 py-4 text-right pr-6"><button onClick={() => handleDownloadInvoice(inv)} className="text-slate-400 hover:text-emerald-600 transition-colors p-2"><i className="fa-solid fa-file-pdf text-rose-500 text-lg"></i></button></td></tr>
                      ))}</tbody>
                    </table>
                  ) : <div className="p-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No verified transaction history</div>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700">
                <img src={formData.avatar || `https://ui-avatars.com/api/?name=${formData.name}&background=random`} className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" alt="Avatar" />
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">{formData.name}</h4>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">{formData.email}</p>
                </div>
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
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mailing / Billing Address</label>
                  <textarea value={formData.address || ''} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all h-24 text-slate-900 dark:text-white resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* ... other tabs omitted for brevity ... */}
        </main>

        <footer className="px-8 py-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration Vault Ready</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 text-[11px] font-black text-slate-500 uppercase tracking-widest hover:text-rose-500 transition-colors">Discard</button>
            <button onClick={handleApply} disabled={isProcessing} className="px-10 py-3 bg-slate-900 dark:bg-emerald-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95">
              {isProcessing && <i className="fa-solid fa-circle-notch animate-spin"></i>}
              Save Configuration
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default SettingsModal;

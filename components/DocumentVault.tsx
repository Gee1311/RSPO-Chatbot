
import React, { useState, useRef, useEffect } from 'react';
import { PolicyDocument } from '../types';
import { extractTextFromImage } from '../services/geminiService';

type VaultStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';

interface DocumentVaultProps {
  policies: PolicyDocument[];
  onAdd: (policy: PolicyDocument) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ policies, onAdd, onRemove, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'SOP' | 'Policy' | 'Report'>('SOP');
  const [content, setContent] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState<VaultStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let active = true;

    const initCamera = async () => {
      if (isScanning) {
        setCameraLoading(true);
        try {
          const constraints = {
            video: { 
              facingMode: { ideal: 'environment' },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          };
          
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }

          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(e => console.warn("Autoplay block:", e));
              if (active) setCameraLoading(false);
            };
          }
        } catch (err) {
          console.error("Camera access failed:", err);
          stopCamera();
          setStatus('error');
          setErrorMessage("Could not access live camera. Using system camera instead.");
          nativeCameraInputRef.current?.click();
        }
      }
    };

    initCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isScanning]);

  const startScanning = () => {
    setIsScanning(true);
    setStatus('idle');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraLoading(false);
  };

  const processImageData = async (base64Data: string, dataUrl: string) => {
    setStatus('processing');
    setPreviewUrl(dataUrl);
    try {
      const extractedText = await extractTextFromImage(base64Data, 'image/jpeg');
      if (extractedText) {
        setContent(prev => (prev ? prev + '\n\n' + extractedText : extractedText));
        if (!name) {
          const firstLine = extractedText.split('\n')[0].replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
          setName(firstLine || 'Scanned Document');
        }
        setStatus('success');
        // Reset status after a delay
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process document.");
      setStatus('error');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Document too large. Please limit uploads to 5MB.");
      return;
    }

    setStatus('uploading');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      if (result) {
        const isPdf = file.type === 'application/pdf';
        const base64Data = result.substring(result.indexOf(',') + 1);
        
        if (isPdf) {
          setPreviewUrl('pdf-placeholder');
          setContent(`[PDF Content Placeholder for ${file.name}]\n\n(Full PDF text extraction requires direct library support in this demo. Please upload images of documents for OCR analysis.)`);
          setName(file.name.replace('.pdf', ''));
          setStatus('success');
          setTimeout(() => setStatus('idle'), 3000);
        } else {
          await processImageData(base64Data, result);
        }
      }
    };
    reader.onerror = () => {
      setStatus('error');
      setErrorMessage("File upload failed.");
    };
    reader.readAsDataURL(file);
    e.target.value = ''; 
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    
    if (video.readyState < 4 || video.videoWidth === 0) {
      alert("Camera feed stabilizing... please wait a moment.");
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      const base64Data = dataUrl.substring(dataUrl.indexOf(',') + 1);
      stopCamera();
      await processImageData(base64Data, dataUrl);
    }
  };

  const handleAdd = () => {
    if (!name || !content) return;
    onAdd({
      id: Date.now().toString(),
      name,
      type,
      content,
      uploadDate: new Date(),
      filePreview: previewUrl || undefined
    });
    setName('');
    setContent('');
    setPreviewUrl(null);
    setStatus('idle');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in slide-in-from-bottom-8 duration-500">
        
        {/* Header */}
        <div className="bg-emerald-800 dark:bg-emerald-950 p-5 md:p-6 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
              <i className="fa-solid fa-vault text-2xl text-emerald-300"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold leading-none">Document Vault</h3>
              <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Enterprise Active
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center hover:bg-black/20 transition-all active:scale-90 relative z-10">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Action Area */}
          <section className="bg-slate-50 dark:bg-slate-800/40 p-5 md:p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Digitization Tools</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Digitize physical records for context-aware auditing</p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button 
                  onClick={startScanning}
                  disabled={isScanning || status === 'processing' || status === 'uploading'}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <i className="fa-solid fa-camera"></i> Live Scan
                </button>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={status === 'processing' || status === 'uploading'}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase hover:bg-emerald-50 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <i className="fa-solid fa-plus-circle"></i> Upload Document
                </button>

                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                <input ref={nativeCameraInputRef} type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFileUpload} />
              </div>
            </div>
            
            <div className="space-y-4">
              {isScanning && (
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center shadow-2xl animate-in fade-in zoom-in duration-300">
                  {cameraLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-900/90 backdrop-blur-sm">
                      <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest text-center">
                        Initializing HD Sensor...<br/>
                        <span className="text-emerald-400 text-[8px] opacity-70">Ensuring RSPO Audit Quality</span>
                      </p>
                    </div>
                  )}
                  
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                  
                  <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                    <div className="w-[85%] h-[80%] border-2 border-white/10 rounded-2xl relative">
                      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                      <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                      
                      {!cameraLoading && (
                        <div className="absolute inset-x-0 h-1 bg-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-[scan_4s_linear_infinite]"></div>
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 z-30">
                    <button 
                      onClick={capturePhoto}
                      className="bg-white text-emerald-800 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-emerald-500/20"
                    >
                      <i className="fa-solid fa-camera text-2xl"></i>
                    </button>
                    <button 
                      onClick={stopCamera}
                      className="bg-black/60 text-white w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all text-xs border border-white/10"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                </div>
              )}

              {(status === 'uploading' || status === 'processing') && (
                <div className="rounded-3xl border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-12 text-center animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl animate-bounce mx-auto mb-6">
                    <i className={`fa-solid ${status === 'uploading' ? 'fa-cloud-arrow-up' : 'fa-microchip'} text-2xl`}></i>
                  </div>
                  <h5 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-2">
                    {status === 'uploading' ? 'Uploading Document' : 'Gemini AI Engine OCR'}
                  </h5>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest animate-pulse">
                    {status === 'uploading' ? 'Transferring to secure vault...' : 'Analyzing document structure & context...'}
                  </p>
                  <div className="w-48 h-1.5 bg-emerald-200 dark:bg-emerald-900 rounded-full mx-auto mt-8 overflow-hidden relative">
                    <div className="absolute inset-0 bg-emerald-600 origin-left animate-[shimmer_2s_infinite_linear]"></div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="rounded-3xl border-2 border-dashed border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-8 text-center animate-in shake duration-500">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                    <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                  </div>
                  <h5 className="text-sm font-bold text-rose-900 dark:text-rose-100 mb-1">Digitization Failed</h5>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 mb-4">{errorMessage || "An unexpected error occurred."}</p>
                  <button 
                    onClick={() => setStatus('idle')}
                    className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-widest hover:underline"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {status === 'success' && (
                <div className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-100 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-2 shadow-lg animate-in slide-in-from-right-4 duration-300">
                  <i className="fa-solid fa-check-circle"></i>
                  DOCUMENT DIGITIZED SUCCESSFULLY
                </div>
              )}

              {!isScanning && status !== 'uploading' && status !== 'processing' && (
                <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider">Document Label</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Nursery Chemical Policy" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider">Audit Category</label>
                        <select 
                          value={type}
                          onChange={(e) => setType(e.target.value as any)}
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer shadow-sm text-slate-900 dark:text-slate-100"
                        >
                          <option value="SOP">SOP (Standard Operating Procedure)</option>
                          <option value="Policy">High-Level Policy / Commitment</option>
                          <option value="Report">Internal Audit / Field Report</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider">Document Preview</label>
                      <div className="h-full min-h-[140px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden flex items-center justify-center relative group">
                        {previewUrl ? (
                          previewUrl === 'pdf-placeholder' ? (
                            <div className="flex flex-col items-center gap-2 p-4 text-center">
                              <i className="fa-solid fa-file-pdf text-4xl text-rose-500"></i>
                              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate w-32 uppercase">PDF Document</p>
                            </div>
                          ) : (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                          )
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-300 dark:text-slate-600">
                            <i className="fa-solid fa-image text-3xl"></i>
                            <p className="text-[9px] font-bold uppercase tracking-widest">No preview available</p>
                          </div>
                        )}
                        {previewUrl && (
                          <button 
                            onClick={() => { setPreviewUrl(null); setStatus('idle'); }}
                            className="absolute top-2 right-2 w-6 h-6 bg-black/60 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-wider">Digitized Content</label>
                    <textarea 
                      placeholder="Scanned or uploaded text will appear here. You can manually edit this content before saving."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full h-44 px-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none font-mono leading-relaxed transition-all shadow-sm text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <canvas ref={canvasRef} className="hidden" />
                  
                  <button 
                    onClick={handleAdd}
                    disabled={!name || !content || status === 'processing' || status === 'uploading'}
                    className="w-full bg-slate-900 dark:bg-emerald-700 hover:bg-emerald-900 dark:hover:bg-emerald-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-emerald-400 dark:text-emerald-200"></i>
                    Add to Enterprise Context
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* List of active docs */}
          <section className="pb-4">
            <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 px-2">Active Knowledge Base ({policies.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map(doc => (
                <div key={doc.id} className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-sm hover:border-emerald-300 dark:hover:border-emerald-700 transition-all relative group overflow-hidden flex flex-col">
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={() => onRemove(doc.id)} className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 flex items-center justify-center transition-all shadow-sm border border-rose-100 dark:border-rose-900">
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-16 h-16 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-inner flex items-center justify-center">
                      {doc.filePreview ? (
                        doc.filePreview === 'pdf-placeholder' ? (
                          <div className="flex flex-col items-center">
                            <i className="fa-solid fa-file-pdf text-2xl text-rose-500"></i>
                            <span className="text-[6px] font-bold text-slate-400 uppercase mt-0.5">PDF</span>
                          </div>
                        ) : (
                          <img src={doc.filePreview} alt={doc.name} className="w-full h-full object-cover" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                          <i className={`fa-solid ${doc.type === 'SOP' ? 'fa-book-open' : 'fa-shield-halved'} text-lg`}></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate mb-0.5">{doc.name}</h5>
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${doc.type === 'SOP' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {doc.type}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed italic border-t border-slate-100 dark:border-slate-700 pt-1 mt-1">
                        "{doc.content.substring(0, 80)}..."
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {policies.length === 0 && (
                <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-slate-50/50 dark:bg-slate-900/40">
                  <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-600">
                    <i className="fa-solid fa-file-circle-exclamation"></i>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest">No site documents loaded</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1">Upload SOPs to get site-specific guidance</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .shake { animation: shake 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default DocumentVault;

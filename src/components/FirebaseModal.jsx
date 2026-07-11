import React from 'react';
import { Database, X } from 'lucide-react';

function FirebaseModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  firebaseConfig, 
  setFirebaseConfig, 
  isFirebaseConnected, 
  onDisconnect 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-neutral-950 text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            Integrasi Cloud (Firebase)
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-100 text-xs text-neutral-500 leading-relaxed shrink-0">
            Aplikasi ini mendukung penyimpanan Cloud Firebase gratis untuk menyinkronkan data antar perangkat. Jika dibiarkan kosong, data disimpan secara offline pada browser lokal Anda.
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">API Key</label>
              <input
                type="text"
                value={firebaseConfig.apiKey}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Project ID</label>
                <input
                  type="text"
                  value={firebaseConfig.projectId}
                  onChange={(e) => setSettings ? setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value }) : setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                  placeholder="puskesmas-molibagu"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Auth Domain</label>
                <input
                  type="text"
                  value={firebaseConfig.authDomain}
                  onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                  placeholder="puskesmas-molibagu.firebaseapp.com"
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">App ID</label>
              <input
                type="text"
                value={firebaseConfig.appId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                placeholder="1:1234567890:web:abcdef..."
                className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2 shrink-0">
            {isFirebaseConnected ? (
              <button
                type="button"
                onClick={onDisconnect}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Putuskan Koneksi Cloud
              </button>
            ) : <div />}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Simpan & Hubungkan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FirebaseModal;

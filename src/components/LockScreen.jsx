import React, { useState } from 'react';
import { Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

function LockScreen({ passwordInput, setPasswordInput, handleLogin, authError }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-radial from-[#ffffff] to-[#f4f4f5]">
      <div className="w-full max-w-md p-8 rounded-3xl glass shadow-xl border border-white/60 text-center animate-fade-in">
        {/* Health Center Medical Icon Logo */}
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <img src="/image/images.png" alt="Logo Puskesmas Molibagu" className="w-20 h-20 object-contain" />
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1">
          SISTEM DANA KAPITASI
        </h1>
        <p className="text-sm text-neutral-500 font-normal mb-8">
          UPTD Puskesmas Molibagu • Kab. Bolsel
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Ketik password privat..."
              className={`w-full pl-12 pr-12 py-3.5 bg-neutral-50 border rounded-2xl focus:outline-none focus:ring-2 text-center text-lg tracking-widest placeholder:tracking-normal placeholder:text-neutral-400 transition-all ${
                authError 
                  ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500' 
                  : 'border-neutral-200 focus:ring-emerald-500/20 focus:border-emerald-500'
              }`}
              autoFocus
            />
            <Lock className="w-4 h-4 text-neutral-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer flex items-center justify-center"
              title={showPassword ? "Sembunyikan Password" : "Tampilkan Password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {authError && (
            <p className="text-xs text-rose-500 font-medium flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Password salah! Silakan coba lagi.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-2xl font-medium tracking-wide shadow-md transition-colors duration-200 cursor-pointer"
          >
            Buka Kunci Dasbor
          </button>
        </form>

        <div className="mt-12 text-[11px] text-neutral-400 tracking-wider font-medium">
          POWERED BY ANTIGRAVITY AI • VERSI ONLINE 2026
        </div>
      </div>
    </div>
  );
}

export default LockScreen;

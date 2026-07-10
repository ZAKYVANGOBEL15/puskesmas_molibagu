import React from 'react';
import { Wifi, WifiOff, Settings, LogOut, Calendar, ChevronDown } from 'lucide-react';
import { MONTHLY_JASPEL } from '../dbService';

const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

function DashboardHeader({ isFirebaseConnected, onOpenFirebase, onOpenSettings, onLogout, bulanAktif, onBulanChange }) {
  const bulanList = Object.keys(MONTHLY_JASPEL);
  const jaspelBulanIni = MONTHLY_JASPEL[bulanAktif] || 0;

  return (
    <header className="flex flex-col gap-4 pb-6 border-b border-neutral-100">
      {/* Row 1: Logo + Title + Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 flex items-center justify-center shrink-0">
            <img src="/image/images.png" alt="Logo Puskesmas Molibagu" className="w-12 h-12 object-contain" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight">
              Dana Kapitasi JKN
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              UPTD Puskesmas Molibagu • Kabupaten Bolaang Mongondow Selatan
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Cloud Badge (Read-Only Status Indicator) */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isFirebaseConnected
                ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700'
                : 'bg-amber-50/50 border-amber-100/50 text-amber-700'
            }`}
          >
            {isFirebaseConnected ? (
              <><Wifi className="w-3.5 h-3.5" /><span>Sinkron Cloud</span></>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" /><span>Mode Lokal</span></>
            )}
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan</span>
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Kunci Layar</span>
          </button>
        </div>
      </div>

      {/* Row 2: Month Selector + Jaspel info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-neutral-50 rounded-2xl px-4 py-3 border border-neutral-100">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>Periode Aktif:</span>
        </div>

        {/* Month Selector */}
        <div className="relative">
          <select
            value={bulanAktif}
            onChange={(e) => onBulanChange(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
          >
            {bulanList.map(bln => (
              <option key={bln} value={bln} disabled={MONTHLY_JASPEL[bln] === 0}>
                {bln} {MONTHLY_JASPEL[bln] === 0 ? '(belum ada data)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-400">Jasa Medis (60%):</span>
          <span className={`font-bold ${jaspelBulanIni > 0 ? 'text-emerald-600' : 'text-neutral-400'}`}>
            {jaspelBulanIni > 0 ? formatRupiah(jaspelBulanIni) : 'Belum ada data'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;

import React from 'react';
import { DollarSign, Calculator, AlertCircle, CheckCircle2, Edit2 } from 'lucide-react';

function StatsBar({ settings, totals, onOpenSettings }) {
  if (!settings) return null;

  // Format currency
  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* Card 1: Total Dana */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden group">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Pagu Jaspel JKN (60%)
          </span>
          <DollarSign className="w-4 h-4 text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold tracking-tight text-neutral-900">
            {formatRupiah(settings.totalDanaJaspel)}
          </span>
          <button 
            onClick={onOpenSettings}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-md transition-colors"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
        <div className="mt-2 text-[11px] font-medium text-neutral-500 flex items-center justify-between border-t border-neutral-50 pt-2">
          <span>Operasional (40%):</span>
          <span className="font-bold text-neutral-700">
            {formatRupiah(Math.round(settings.totalDanaJaspel * 2 / 3))}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-emerald-500"></div>
      </div>

      {/* Card 2: Total Poin */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Total Poin Terkumpul
          </span>
          <Calculator className="w-4 h-4 text-sky-500" />
        </div>
        <span className="text-xl font-bold tracking-tight text-neutral-900">
          {totals.totalPoin} <span className="text-sm font-medium text-neutral-400">poin</span>
        </span>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-sky-500"></div>
      </div>

      {/* Card 3: Total Pajak PPh 21 */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Estimasi Pajak PPh 21
          </span>
          <AlertCircle className="w-4 h-4 text-rose-500" />
        </div>
        <span className="text-xl font-bold tracking-tight text-neutral-900">
          {formatRupiah(totals.totalTax)}
        </span>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-rose-500"></div>
      </div>

      {/* Card 4: Total SPJ Netto */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Total SPJ Bersih
          </span>
          <CheckCircle2 className="w-4 h-4 text-teal-500" />
        </div>
        <span className="text-xl font-bold tracking-tight text-neutral-900 text-teal-600">
          {formatRupiah(totals.totalNetto)}
        </span>
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-teal-500"></div>
      </div>

    </div>
  );
}

export default StatsBar;

import React from 'react';
import { Calculator, AlertCircle, CheckCircle2, Edit2, Landmark, Percent } from 'lucide-react';
import { MONTHLY_JASPEL } from '../dbService';

function StatsBar({ settings, totals, onOpenSettings }) {
  if (!settings) return null;

  const bulanAktif = settings.bulanAktif || 'JANUARI';
  const activeYear = settings.tahunAktif || '2026';
  const compoundKey = `${activeYear}_${bulanAktif}`;

  const mKapitasi = (settings.monthlyKapitasi && settings.monthlyKapitasi[compoundKey] !== undefined)
    ? settings.monthlyKapitasi[compoundKey]
    : (activeYear === '2026' && settings.monthlyKapitasi?.[bulanAktif] !== undefined
       ? settings.monthlyKapitasi[bulanAktif]
       : (activeYear === '2026' && MONTHLY_JASPEL[bulanAktif] ? Math.round(MONTHLY_JASPEL[bulanAktif] / 0.75) : 0));

  const jaspel60 = Math.round(mKapitasi * 0.60);
  const totalJaspelDibagikan = jaspel60;
  const operasional40 = Math.round(mKapitasi * 0.40);

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
    <div className="flex flex-col gap-4">
      
      {/* Group A: Alokasi Pagu Anggaran (Sisi Kiri) */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-150/70 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-3 bg-blue-500 rounded-xs shrink-0"></span>
            <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase truncate">
              Alokasi Pagu (BPJS)
            </span>
          </div>
          <button 
            onClick={onOpenSettings}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/75 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Edit2 className="w-2.5 h-2.5" />
            <span>Ubah</span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Item 1: Total Kapitasi */}
          <div className="bg-neutral-50/50 border border-neutral-100 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-neutral-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                Pagu Kapitasi (100%)
              </div>
              <div className="text-xs font-extrabold text-neutral-800 tracking-tight">
                {mKapitasi > 0 ? formatRupiah(mKapitasi) : 'Rp 0'}
              </div>
            </div>
            <div className="text-[9px] text-neutral-400 mt-1 flex items-center gap-1">
              <Landmark className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
              <span>Sumber BPJS</span>
            </div>
          </div>

          {/* Item 2: Dana Jaspel */}
          <div className="bg-emerald-50/20 border border-emerald-100/60 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-emerald-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                Dana Jasa Medis (60%)
              </div>
              <div className="text-xs font-extrabold text-emerald-600 tracking-tight">
                {totalJaspelDibagikan > 0 ? formatRupiah(totalJaspelDibagikan) : 'Rp 0'}
              </div>
            </div>
            <div className="text-[9px] text-emerald-600/70 mt-1">
              Murni porsi 60%
            </div>
          </div>

          {/* Item 3: Biaya Operasional */}
          <div className="bg-sky-50/20 border border-sky-100/60 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-sky-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">
                Operasional (40%)
              </div>
              <div className="text-xs font-extrabold text-neutral-700 tracking-tight">
                {operasional40 > 0 ? formatRupiah(operasional40) : 'Rp 0'}
              </div>
            </div>
            <div className="text-[9px] text-neutral-400 mt-1 flex items-center gap-1">
              <Percent className="w-2.5 h-2.5 text-sky-500 shrink-0" />
              <span>40% dari Kapitasi</span>
            </div>
          </div>
        </div>
      </div>

      {/* Group B: Realisasi Pembayaran SPJ (Sisi Kanan) */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-150/70 shadow-xs flex flex-col">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-3 bg-teal-500 rounded-xs shrink-0"></span>
            <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase truncate">
              Distribusi Jasa Medis
            </span>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded shrink-0">
            Hasil Tabel
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {/* Item 1: Total Poin */}
          <div className="bg-neutral-50/50 border border-neutral-100 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-neutral-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">
                Total Poin Pegawai
              </div>
              <div className="text-xs font-extrabold text-neutral-800 tracking-tight">
                {totals.totalPoin} <span className="text-[10px] font-medium text-neutral-400">poin</span>
              </div>
            </div>
            <div className="text-[9px] text-neutral-400 mt-1 flex items-center gap-1">
              <Calculator className="w-2.5 h-2.5 text-sky-500 shrink-0" />
              <span>Akumulasi poin</span>
            </div>
          </div>

          {/* Item 2: Estimasi Pajak */}
          <div className="bg-rose-50/20 border border-rose-100/60 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-rose-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">
                Potongan Pajak PPh 21
              </div>
              <div className="text-xs font-extrabold text-rose-600 tracking-tight">
                {formatRupiah(totals.totalTax)}
              </div>
            </div>
            <div className="text-[9px] text-neutral-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
              <span>Sesuai golongan</span>
            </div>
          </div>

          {/* Item 3: Total SPJ Bersih */}
          <div className="bg-teal-50/20 border border-teal-100/60 p-3 rounded-xl flex flex-col justify-between hover:bg-white hover:border-teal-200 transition-all">
            <div>
              <div className="text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">
                Total SPJ Bersih
              </div>
              <div className="text-xs font-extrabold text-teal-600 tracking-tight">
                {formatRupiah(totals.totalNetto)}
              </div>
            </div>
            <div className="text-[9px] text-teal-600/70 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5 text-teal-500 shrink-0" />
              <span>Siap dibayarkan</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default StatsBar;

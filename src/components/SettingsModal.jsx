import React, { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';

function SettingsModal({ isOpen, onClose, onSubmit, settings, setSettings }) {
  const [kapitasi100Raw, setKapitasi100Raw] = useState('');
  const [silpaRaw, setSilpaRaw] = useState('');

  useEffect(() => {
    if (isOpen && settings) {
      // Reverse-calculate: totalDanaJaspel = jaspel75 + silpa
      // Excel Puskesmas Molibagu pakai 75% untuk Jaspel (meski label Excel tulis 60%)
      const silpa = settings.silpaJasaMedis || 0;
      const jaspel75 = (settings.totalDanaJaspel || 0) - silpa;
      const total100 = jaspel75 > 0 ? Math.round(jaspel75 / 0.75) : 0;
      setKapitasi100Raw(total100 > 0 ? String(total100) : '');
      setSilpaRaw(silpa > 0 ? String(silpa) : '');
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  const total100 = parseInt(kapitasi100Raw) || 0;
  const jaspel75 = Math.round(total100 * 0.75);  // Excel pakai 75% bukan 60%
  const operasional40 = Math.round(total100 * 0.40);
  const silpa = parseInt(silpaRaw) || 0;
  const totalJaspelPool = jaspel75 + silpa;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-neutral-100 overflow-hidden my-8">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-neutral-950 text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Konfigurasi Parameter & Bobot Poin
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          
          {/* 1. Basic configs */}
          <div className="space-y-4">
            {/* Input Total Kapitasi 100% */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Dana Kapitasi Diterima (100%)
              </label>
              <input
                type="text"
                value={new Intl.NumberFormat('id-ID').format(total100)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setKapitasi100Raw(digits);
                  const t100 = parseInt(digits) || 0;
                  const j75 = Math.round(t100 * 0.75);
                  const s = parseInt(silpaRaw) || 0;
                  setSettings({ ...settings, totalDanaJaspel: j75 + s });
                }}
                placeholder="Masukkan total dana yang cair dari BPJS..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-neutral-400">💡 Input angka total kapitasi dari BPJS. Sistem hitung 75% untuk Jaspel dan 40% untuk Biaya Operasional (sesuai formula Excel Puskesmas Molibagu).</p>
            </div>

            {/* Hasil otomatis 60% dan 40% */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Jasa Medis / Jaspel (75%)</div>
                <div className="text-sm font-bold text-emerald-800">
                  Rp {new Intl.NumberFormat('id-ID').format(jaspel75)}
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">Biaya Operasional (40%)</div>
                <div className="text-sm font-bold text-sky-800">
                  Rp {new Intl.NumberFormat('id-ID').format(operasional40)}
                </div>
              </div>
            </div>

            {/* SILPA Jasa Medis */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                SILPA Jasa Medis (Sisa Bulan Lalu)
              </label>
              <input
                type="text"
                value={new Intl.NumberFormat('id-ID').format(silpa)}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setSilpaRaw(digits);
                  const s = parseInt(digits) || 0;
                  const j75 = Math.round((parseInt(kapitasi100Raw) || 0) * 0.75);
                  setSettings({ ...settings, silpaJasaMedis: s, totalDanaJaspel: j75 + s });
                }}
                placeholder="0 jika tidak ada SILPA..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-neutral-400">📋 SILPA otomatis ditambahkan ke pool Jaspel bulan ini.</p>
            </div>

            {/* Total Pool Jaspel */}
            <div className="bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Total Pool Jaspel Dibagikan (60% + SILPA)</div>
              <div className="text-base font-bold text-emerald-900">
                Rp {new Intl.NumberFormat('id-ID').format(totalJaspelPool)}
              </div>
            </div>
          </div>

          {/* Hari Kerja Efektif */}
          <div className="space-y-1.5 border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pb-1.5">
              Hari Kerja ({settings.bulanAktif || 'JANUARI'})
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Hari Efektif Kerja Bulan Ini
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={
                  settings.hariEfektifPerBulan && settings.hariEfektifPerBulan[settings.bulanAktif || 'JANUARI'] != null
                    ? settings.hariEfektifPerBulan[settings.bulanAktif || 'JANUARI']
                    : (settings.hariEfektifDefault || 22)
                }
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 22);
                  const bulan = settings.bulanAktif || 'JANUARI';
                  const currentMap = settings.hariEfektifPerBulan || {};
                  setSettings({
                    ...settings,
                    hariEfektifDefault: val,
                    hariEfektifPerBulan: { ...currentMap, [bulan]: val }
                  });
                }}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-neutral-400">📅 Jumlah hari kerja efektif bulan {settings.bulanAktif || 'JANUARI'} berlaku untuk semua pegawai. Ubah hanya di sini.</p>
            </div>
          </div>

          {/* Ganti Password */}
          <div className="space-y-1.5 border-t border-neutral-100 pt-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider pb-1.5">
              Keamanan Akses
            </h4>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Password Login Dasbor
              </label>
              <input
                type="text"
                value={settings.password || 'jm'}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Ganti password..."
              />
              <p className="text-[11px] text-neutral-400">⚠️ Ubah password hanya saat diperlukan. Pastikan dicatat dengan aman sebelum disimpan.</p>
            </div>
          </div>

          {/* Bobot Poin Pendidikan / Profesi */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-1.5">
              Bobot Poin Pendidikan / Profesi (Poin Dasar)
            </h4>
            <div className="space-y-3">
              {settings.poinPendidikan && Object.keys(settings.poinPendidikan).map(pend => (
                <div key={pend} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-neutral-600">{pend}</span>
                  <input
                    type="number"
                    value={settings.poinPendidikan[pend]}
                    onChange={(e) => {
                      const updatedPend = { ...settings.poinPendidikan, [pend]: parseInt(e.target.value) || 0 };
                      setSettings({ ...settings, poinPendidikan: updatedPend });
                    }}
                    className="w-24 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-center focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 2. Bobot Golongan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-1.5">
              Bobot Poin Golongan Kepegawaian (Opsional)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.keys(settings.poinGolongan).slice(0, 8).map(gol => (
                <div key={gol} className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-neutral-400">{gol}</span>
                  <input
                    type="number"
                    value={settings.poinGolongan[gol]}
                    onChange={(e) => {
                      const updatedGol = { ...settings.poinGolongan, [gol]: parseInt(e.target.value) || 0 };
                      setSettings({ ...settings, poinGolongan: updatedGol });
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-neutral-400">Non-PNS</span>
                <input
                  type="number"
                  value={settings.poinGolongan['Non-PNS']}
                  onChange={(e) => {
                    const updatedGol = { ...settings.poinGolongan, 'Non-PNS': parseInt(e.target.value) || 0 };
                    setSettings({ ...settings, poinGolongan: updatedGol });
                  }}
                  className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* 3. Bobot Tugas Tambahan */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-1.5">
              Bobot Poin Tugas Tambahan (Jabatan)
            </h4>
            <div className="space-y-2">
              {Object.keys(settings.poinTugasTambahan).map(jab => (
                <div key={jab} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-medium text-neutral-600">{jab}</span>
                  <input
                    type="number"
                    value={settings.poinTugasTambahan[jab]}
                    onChange={(e) => {
                      const updatedJab = { ...settings.poinTugasTambahan, [jab]: parseInt(e.target.value) || 0 };
                      setSettings({ ...settings, poinTugasTambahan: updatedJab });
                    }}
                    className="w-24 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium text-center focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 4. Rates PPh 21 */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-1.5">
              Persentase Tarif PPh 21 (%)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.keys(settings.pph21Rates).map(group => (
                <div key={group} className="flex flex-col gap-1">
                  <span className="text-[11px] font-semibold text-neutral-400">{group}</span>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.pph21Rates[group]}
                    onChange={(e) => {
                      const updatedRates = { ...settings.pph21Rates, [group]: parseFloat(e.target.value) || 0 };
                      setSettings({ ...settings, pph21Rates: updatedRates });
                    }}
                    className="w-full px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsModal;

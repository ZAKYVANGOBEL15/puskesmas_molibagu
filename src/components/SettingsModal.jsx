import React, { useState, useEffect } from 'react';
import { Settings, X, Plus, Trash2 } from 'lucide-react';

function SettingsModal({ isOpen, onClose, onSubmit, settings, setSettings }) {
  const [kapitasi100Raw, setKapitasi100Raw] = useState('');
  const [newJabName, setNewJabName] = useState('');
  const [newJabPoints, setNewJabPoints] = useState('');

  const handleAddJabatan = () => {
    if (!newJabName.trim()) return;
    const pts = parseInt(newJabPoints) || 0;
    const updated = {
      ...(settings.poinTugasTambahan || {}),
      [newJabName.trim()]: pts
    };
    setSettings({
      ...settings,
      poinTugasTambahan: updated
    });
    setNewJabName('');
    setNewJabPoints('');
  };

  const handleRemoveJabatan = (jabName) => {
    const updated = { ...(settings.poinTugasTambahan || {}) };
    delete updated[jabName];
    setSettings({
      ...settings,
      poinTugasTambahan: updated
    });
  };

  useEffect(() => {
    if (isOpen && settings) {
      const activeMonth = settings.bulanAktif || 'JANUARI';
      const activeYear = settings.tahunAktif || '2026';
      const compoundKey = `${activeYear}_${activeMonth}`;
      
      const mKapitasi = (settings.monthlyKapitasi && settings.monthlyKapitasi[compoundKey] !== undefined)
        ? settings.monthlyKapitasi[compoundKey]
        : (activeYear === '2026' && settings.monthlyKapitasi && settings.monthlyKapitasi[activeMonth] !== undefined
           ? settings.monthlyKapitasi[activeMonth]
           : (settings.totalDanaJaspel ? Math.round(settings.totalDanaJaspel / 0.60) : 0));
        
      setKapitasi100Raw(mKapitasi > 0 ? String(mKapitasi) : '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, settings?.bulanAktif, settings?.tahunAktif]);

  if (!isOpen || !settings) return null;

  const total100 = parseInt(kapitasi100Raw) || 0;
  const jaspel60 = Math.round(total100 * 0.60);  // Jasa Medis 60%
  const operasional40 = Math.round(total100 * 0.40);
  const totalJaspelPool = jaspel60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-neutral-950 text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Konfigurasi Parameter & Bobot Poin ({settings.bulanAktif || 'JANUARI'} {settings.tahunAktif || '2026'})
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* 1. Basic configs */}
          <div className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100 mb-2">
              <p className="text-xs font-semibold text-neutral-600">
                ✏️ Mengedit Parameter Keuangan Periode: <span className="text-emerald-600 font-bold">{settings.bulanAktif || 'JANUARI'} {settings.tahunAktif || '2026'}</span>
              </p>
            </div>

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
                  const j60 = Math.round(t100 * 0.60);
                  const activeMonth = settings.bulanAktif || 'JANUARI';
                  const activeYear = settings.tahunAktif || '2026';
                  const compoundKey = `${activeYear}_${activeMonth}`;
                  const currentKapitasi = settings.monthlyKapitasi || {};
                  
                  setSettings({ 
                    ...settings, 
                    totalDanaJaspel: j60,
                    monthlyKapitasi: { ...currentKapitasi, [compoundKey]: t100 }
                  });
                }}
                placeholder="Masukkan total dana yang cair dari BPJS..."
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <p className="text-[11px] text-neutral-400">💡 Input angka total kapitasi dari BPJS. Sistem hitung 60% untuk Jasa Medis dan 40% untuk Biaya Operasional (sesuai formula Excel Puskesmas Molibagu).</p>
            </div>

            {/* Hasil otomatis 60% dan 40% */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Jasa Medis (60%)</div>
                <div className="text-sm font-bold text-emerald-800">
                  Rp {new Intl.NumberFormat('id-ID').format(jaspel60)}
                </div>
              </div>
              <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3">
                <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-0.5">Biaya Operasional (40%)</div>
                <div className="text-sm font-bold text-sky-800">
                  Rp {new Intl.NumberFormat('id-ID').format(operasional40)}
                </div>
              </div>
            </div>

            {/* Total Pool Jaspel */}
            <div className="bg-emerald-100 border border-emerald-200 rounded-xl px-4 py-3">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Total Pool Jasa Medis Dibagikan (60%)</div>
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
              {Object.keys(settings.poinGolongan).filter(gol => gol !== 'Non-PNS').map(gol => (
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
          <div className="space-y-4 bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 pb-1.5 flex items-center justify-between">
              <span>Bobot Poin Tugas Tambahan (Jabatan)</span>
              <span className="text-[10px] text-emerald-600 font-semibold lowercase bg-emerald-50 px-2 py-0.5 rounded-full">Dapat disesuaikan</span>
            </h4>
            
            {/* List of current Jabatans */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.keys(settings.poinTugasTambahan || {}).length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-2">Belum ada tugas tambahan / jabatan yang ditambahkan.</p>
              ) : (
                Object.keys(settings.poinTugasTambahan).map(jab => (
                  <div key={jab} className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-neutral-100 shadow-xs">
                    <span className="text-xs font-semibold text-neutral-700 truncate">{jab}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <input
                        type="number"
                        value={settings.poinTugasTambahan[jab]}
                        onChange={(e) => {
                          const updatedJab = { ...settings.poinTugasTambahan, [jab]: parseInt(e.target.value) || 0 };
                          setSettings({ ...settings, poinTugasTambahan: updatedJab });
                        }}
                        className="w-20 px-2.5 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        title="Poin"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveJabatan(jab)}
                        className="p-1.5 hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Jabatan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Form to add a new Jabatan */}
            <div className="pt-3 border-t border-neutral-100/85">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">➕ Tambah Jabatan Baru</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Nama Jabatan (misal: PJ Mutu, Penanggung Jawab...)"
                  value={newJabName}
                  onChange={(e) => setNewJabName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Poin"
                    value={newJabPoints}
                    onChange={(e) => setNewJabPoints(e.target.value)}
                    className="w-20 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs font-semibold text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddJabatan}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah
                  </button>
                </div>
              </div>
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

          <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-2 shrink-0">
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

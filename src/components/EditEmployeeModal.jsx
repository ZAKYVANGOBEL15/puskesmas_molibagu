import React from 'react';
import { Settings, X } from 'lucide-react';

function EditEmployeeModal({ isOpen, onClose, onSubmit, editingEmployee, setEditingEmployee, settings }) {
  if (!isOpen || !editingEmployee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg border border-neutral-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-bold text-neutral-950 text-base flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            Edit Detail Pegawai
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-neutral-500">Nama Lengkap</label>
              <input
                type="text"
                required
                value={editingEmployee.nama}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, nama: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-neutral-500">NIP / Identitas Pegawai</label>
              <input
                type="text"
                required
                value={editingEmployee.nip}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, nip: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-neutral-500">Pendidikan / Profesi (Poin Dasar)</label>
              <select
                value={editingEmployee.pendidikan || 'S1 Kesehatan (SKM, S.Kep, S.Keb)'}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, pendidikan: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {settings && settings.poinPendidikan && Object.keys(settings.poinPendidikan).map(pend => (
                  <option key={pend} value={pend}>{pend}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Golongan (Pajak PPh 21)</label>
              <select
                value={editingEmployee.golongan}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, golongan: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {settings && settings.poinGolongan && Object.keys(settings.poinGolongan).map(gol => (
                  <option key={gol} value={gol}>{gol}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500">Masa Kerja (Tahun)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={editingEmployee.masaKerja}
                onChange={(e) => {
                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                  const bulan = settings ? settings.bulanAktif || 'JANUARI' : 'JANUARI';
                  const currentMap = editingEmployee.masaKerjaPerBulan || {};
                  setEditingEmployee({ 
                    ...editingEmployee, 
                    masaKerja: val, 
                    masaKerjaPerBulan: { ...currentMap, [bulan]: val } 
                  });
                }}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="text-xs font-semibold text-neutral-500">Tugas Tambahan / Jabatan</label>
              <select
                value={editingEmployee.tugasTambahan}
                onChange={(e) => setEditingEmployee({ ...editingEmployee, tugasTambahan: e.target.value })}
                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {settings && settings.poinTugasTambahan && Object.keys(settings.poinTugasTambahan).map(jab => (
                  <option key={jab} value={jab}>{jab}</option>
                ))}
              </select>
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEmployeeModal;

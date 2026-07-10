import React from 'react';
import { Search, UserPlus, Download, RefreshCw, Settings, Trash2 } from 'lucide-react';

function EmployeeTable({ 
  employees, 
  onAttendanceChange, 
  onEditEmployee, 
  onDeleteEmployee, 
  searchQuery, 
  setSearchQuery, 
  onAddClick, 
  onExportCSV, 
  loading, 
  totals 
}) {

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
    <div className="bg-white rounded-3xl border border-neutral-100 shadow-sm overflow-hidden flex flex-col">
      
      {/* Top Toolbar */}
      <div className="p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white">
        
        {/* Search bar */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama atau NIP pegawai..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-50/50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-neutral-400"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pegawai</span>
          </button>
          
          <button
            onClick={onExportCSV}
            disabled={!employees.length}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 rounded-xl text-xs font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Table Area */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-neutral-400 animate-spin" />
          <span className="text-sm font-medium text-neutral-500">Memuat data pegawai...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="p-16 text-center text-neutral-400 text-sm">
          Tidak ada data pegawai. {searchQuery ? 'Ganti kata pencarian.' : 'Klik "+ Tambah Pegawai" untuk memulai.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50/50 border-b border-neutral-100 text-neutral-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-16">NO</th>
                <th className="py-4 px-6">NAMA / NIP</th>
                <th className="py-4 px-6 text-center w-28">GOL</th>
                <th className="py-4 px-6 text-center w-28">MASA KERJA</th>
                <th className="py-4 px-6 text-center w-36">HARI MASUK</th>
                <th className="py-4 px-6 text-center w-36">HARI EFEKTIF</th>
                <th className="py-4 px-6 text-right w-44">SPJ BERSIH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {employees.map((emp, idx) => (
                <tr key={emp.id} className="hover:bg-neutral-50/45 transition-colors group">
                  {/* 1. NO */}
                  <td className="py-4 px-6 text-center text-sm font-medium text-neutral-400">
                    {idx + 1}
                  </td>
                  
                  {/* 2. NAMA / NIP */}
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm">{emp.nama}</div>
                        <div className="text-[11px] text-neutral-400 font-medium tracking-wide mt-0.5">{emp.nip}</div>
                      </div>
                      
                      {/* Hover Row Actions */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity ml-4">
                        <button
                          onClick={() => onEditEmployee(emp)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Detail Pegawai"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteEmployee(emp.id, emp.nama)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Pegawai"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>
                  
                  {/* 3. GOL */}
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
                      emp.golongan.startsWith('IV') 
                        ? 'bg-purple-50 text-purple-700 border border-purple-100/50' 
                        : emp.golongan.startsWith('III') 
                          ? 'bg-sky-50 text-sky-700 border border-sky-100/50' 
                          : emp.golongan === 'Non-PNS'
                            ? 'bg-neutral-100 text-neutral-700'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                    }`}>
                      {emp.golongan}
                    </span>
                  </td>
                  
                  {/* 3.5 MASA KERJA */}
                  <td className="py-4 px-6 text-center text-sm font-semibold text-neutral-600">
                    {typeof emp.masaKerja === 'number' ? `${emp.masaKerja.toFixed(2)} Th` : '-'}
                  </td>
                  
                  {/* 4. HARI MASUK */}
                  <td className="py-3 px-6 text-center">
                    <input
                      type="number"
                      min="0"
                      max={emp.hariEfektif}
                      value={emp.hariMasuk}
                      onChange={(e) => onAttendanceChange(emp.id, 'hariMasuk', e.target.value)}
                      className="w-20 text-center font-medium bg-neutral-50 hover:bg-neutral-100/50 focus:bg-white border border-neutral-200 hover:border-neutral-300 focus:border-emerald-500 rounded-lg py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                    />
                  </td>
                  
                  {/* 5. HARI EFEKTIF - Read Only (diatur dari Pengaturan) */}
                  <td className="py-3 px-6 text-center">
                    <span className="inline-flex items-center justify-center w-20 py-1 px-2 text-sm font-semibold text-neutral-500 bg-neutral-100 rounded-lg">
                      {emp.hariEfektif}
                    </span>
                  </td>
                  
                  {/* 6. SPJ BERSIH */}
                  <td className="py-4 px-6 text-right font-bold text-neutral-800 text-sm">
                    {formatRupiah(emp.spjBersih)}
                  </td>
                </tr>
              ))}
              
              {/* Summary Total Row */}
              <tr className="bg-neutral-50/30 font-bold border-t border-neutral-200/80">
                <td className="py-4 px-6 text-center text-xs text-neutral-400">#</td>
                <td className="py-4 px-6 text-sm text-neutral-900">TOTAL SELURUH</td>
                <td className="py-4 px-6"></td>
                <td className="py-4 px-6"></td>
                <td className="py-4 px-6 text-center text-sm text-neutral-600">{totals.totalHariMasuk} hr</td>
                <td className="py-4 px-6"></td>
                <td className="py-4 px-6 text-right text-emerald-600 text-base">{formatRupiah(totals.totalNetto)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom info section */}
      <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-neutral-500 font-medium">
        <div>
          * SPJ Bersih terhitung real-time berdasarkan bobot Golongan, Poin Masa Kerja desimal, Tugas Tambahan, dan Persentase Absensi (Masuk / Efektif).
        </div>
        <div>
          Total Pajak PPh 21 Terpotong: {formatRupiah(totals.totalTax)}
        </div>
      </div>

    </div>
  );
}

export default EmployeeTable;

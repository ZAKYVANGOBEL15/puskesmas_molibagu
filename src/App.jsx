import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  fetchEmployees,
  saveEmployee,
  deleteEmployee,
  saveEmployeesBatch,
  fetchSettings,
  saveSettings,
  calculateJaspel,
  isFirebaseConnected,
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  MONTHLY_JASPEL,
  subscribeSettings,
  subscribeEmployees
} from './dbService';

// Import Modular Components
import LockScreen from './components/LockScreen';
import DashboardHeader from './components/DashboardHeader';
import Sidebar from './components/Sidebar';
import EmployeeTable from './components/EmployeeTable';
import AddEmployeeModal from './components/AddEmployeeModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import SettingsModal from './components/SettingsModal';
import FirebaseModal from './components/FirebaseModal';
import './App.css';

function App() {
  // Authentication State
  const [isLocked, setIsLocked] = useState(() => {
    const auth = sessionStorage.getItem('molibagu_auth');
    return auth !== 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Core Data State
  const [employees, setEmployees] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase Config State
  const [firebaseConnected, setFirebaseConnected] = useState(() => isFirebaseConnected());
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  // Modal control states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Selected employee for editing
  const [editingEmployee, setEditingEmployee] = useState(null);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    nama: '',
    nip: '',
    golongan: 'III/a',
    pendidikan: 'S1',
    masaKerja: 0,
    tugasTambahan: 'Staf / Pelaksana',
    hariMasuk: 22,
    hariEfektif: 22
  });

  // Load configuration & data & subscribe to real-time updates
  useEffect(() => {
    if (isLocked) return;

    loadData();

    let unsubSettings = null;
    let unsubEmployees = null;

    if (firebaseConnected) {
      unsubSettings = subscribeSettings((updatedSettings) => {
        setSettings(prev => prev ? { ...prev, ...updatedSettings } : updatedSettings);
      });
      unsubEmployees = subscribeEmployees((updatedEmployees) => {
        setEmployees(updatedEmployees);
      });
    }

    return () => {
      if (unsubSettings) unsubSettings();
      if (unsubEmployees) unsubEmployees();
    };
  }, [isLocked, firebaseConnected]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dbSettings = await fetchSettings();
      if (dbSettings) {
        dbSettings.tahunAktif = '2026';
      }
      // Auto-save settings back to cleanly overwrite and remove stale categories in Firebase/local storage
      await saveSettings(dbSettings).catch(() => {});
      const dbEmployees = await fetchEmployees();

       // Jika totalDanaJaspel belum diset (pertama kali), isi dari MONTHLY_JASPEL
      // Tapi JANGAN override jika user sudah set manual — biarkan user settings yang menang
      if (dbSettings && dbSettings.bulanAktif && !dbSettings.totalDanaJaspel) {
        const masterJaspel = MONTHLY_JASPEL[dbSettings.bulanAktif] || 0;
        if (masterJaspel > 0) {
          dbSettings.totalDanaJaspel = Math.round((masterJaspel / 0.75) * 0.60);
          saveSettings(dbSettings).catch(() => {});
        }
      }

      setSettings(dbSettings);
      setEmployees(dbEmployees);

      // Load current Firebase config into state
      const currentConfig = getStoredFirebaseConfig();
      if (currentConfig) {
        setFirebaseConfig(currentConfig);
      }
    } catch (err) {
      showToast('Gagal memuat data!', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for status toasts
  const showToast = (message, type = 'success') => {
    setToastMessage({ text: message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock screen handle login
  const handleLogin = (e) => {
    e.preventDefault();
    const correctPassword = settings ? settings.password || 'jm' : 'jm';
    if (passwordInput === correctPassword) {
      sessionStorage.setItem('molibagu_auth', 'true');
      setIsLocked(false);
      setAuthError(false);
      showToast('Selamat Datang di Dasbor Kapitasi');
    } else {
      setAuthError(true);
      setPasswordInput('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    sessionStorage.removeItem('molibagu_auth');
    setIsLocked(true);
    setPasswordInput('');
  };

  // Real-time calculations memoized based on employees list and settings
  const calculatedEmployees = useMemo(() => {
    if (!employees.length || !settings) return [];
    return calculateJaspel(employees, settings);
  }, [employees, settings]);

  // Overall totals
  const totals = useMemo(() => {
    const result = {
      totalPoin: 0,
      totalBruto: 0,
      totalTax: 0,
      totalNetto: 0,
      totalHariMasuk: 0
    };

    calculatedEmployees.forEach(emp => {
      result.totalPoin += emp.finalPoints || 0;
      result.totalBruto += emp.bruto || 0;
      result.totalTax += emp.taxAmount || 0;
      result.totalNetto += emp.spjBersih || 0;
      result.totalHariMasuk += emp.hariMasuk || 0;
    });

    result.totalPoin = Number(result.totalPoin.toFixed(3));
    return result;
  }, [calculatedEmployees]);

  // Handle cell inline edit for Hari Masuk and Hari Efektif
  const handleAttendanceChange = async (empId, field, val) => {
    const value = Math.max(0, Number(val) || 0);
    const bulan = settings ? settings.bulanAktif || 'JANUARI' : 'JANUARI';
    const tahun = settings ? settings.tahunAktif || '2026' : '2026';
    const compoundKey = `${tahun}_${bulan}`;

    const updated = employees.map(emp => {
      if (emp.id === empId) {
        const subFieldName = field === 'hariMasuk' ? 'hariMasukPerBulan' : 'hariEfektifPerBulan';
        const currentMap = emp[subFieldName] || {};
        return {
          ...emp,
          [subFieldName]: { ...currentMap, [compoundKey]: value },
          // Keep legacy field updated as a fallback for visual consistency
          [field]: value
        };
      }
      return emp;
    });
    setEmployees(updated);

    // Save to DB in background
    const targetEmp = updated.find(emp => emp.id === empId);
    if (targetEmp) {
      await saveEmployee(targetEmp);
    }
  };

  // Add employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmployee.nama) {
      showToast('Nama wajib diisi!', 'error');
      return;
    }

    try {
      const updated = await saveEmployee({
        ...newEmployee,
        nip: newEmployee.nip || '-',
        hariEfektif: settings ? settings.hariEfektifDefault : 22,
        hariMasuk: settings ? settings.hariEfektifDefault : 22
      });
      setEmployees(updated);
      setShowAddModal(false);
      // Reset form
      setNewEmployee({
        nama: '',
        nip: '',
        golongan: 'III/a',
        pendidikan: 'S1',
        masaKerja: 0,
        tugasTambahan: 'Staf / Pelaksana',
        hariMasuk: settings ? settings.hariEfektifDefault : 22,
        hariEfektif: settings ? settings.hariEfektifDefault : 22
      });
      showToast('Pegawai berhasil ditambahkan');
    } catch (err) {
      showToast('Gagal menambahkan pegawai', 'error');
    }
  };

  // Update employee details (detailed edit)
  const handleUpdateEmployeeDetails = async (e) => {
    e.preventDefault();
    try {
      const updated = await saveEmployee(editingEmployee);
      setEmployees(updated);
      setEditingEmployee(null);
      showToast('Data pegawai berhasil diperbarui');
    } catch (err) {
      showToast('Gagal memperbarui data', 'error');
    }
  };

  // Delete employee
  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pegawai "${name}"?`)) {
      try {
        const updated = await deleteEmployee(id);
        setEmployees(updated);
        showToast('Data pegawai berhasil dihapus');
      } catch (err) {
        showToast(err.message || 'Gagal menghapus data', 'error');
      }
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const saved = await saveSettings(settings);
      setSettings(saved);
      setShowSettingsModal(false);
      showToast('Pengaturan berhasil disimpan');
    } catch (err) {
      showToast('Gagal menyimpan pengaturan', 'error');
    }
  };

  // Ganti bulan aktif → update totalDanaJaspel otomatis dari Data Master atau map dinamis
  const handleBulanChange = async (bulan) => {
    const tahun = settings?.tahunAktif || '2026';
    const compoundKey = `${tahun}_${bulan}`;

    // Cari nilai Kapitasi dan SILPA di settings, fallback ke master data
    const mKapitasi = (settings && settings.monthlyKapitasi && settings.monthlyKapitasi[compoundKey] !== undefined)
      ? settings.monthlyKapitasi[compoundKey]
      : (tahun === '2026' && settings?.monthlyKapitasi?.[bulan] !== undefined
         ? settings.monthlyKapitasi[bulan]
         : (tahun === '2026' && MONTHLY_JASPEL[bulan] ? Math.round(MONTHLY_JASPEL[bulan] / 0.75) : 0));
      
    const jaspelBulan = Math.round(mKapitasi * 0.60);
    
    const updatedSettings = { 
      ...settings, 
      bulanAktif: bulan, 
      totalDanaJaspel: jaspelBulan,
      silpaJasaMedis: 0
    };
    
    // Optimistic update: ganti di UI secara instan agar tidak beku
    setSettings(updatedSettings);
    
    if (jaspelBulan === 0) {
      showToast(`Periode diubah ke ${bulan} ${tahun}. Silakan isi Dana Kapitasi di menu Pengaturan.`, 'error');
    } else {
      showToast(`Periode diubah ke ${bulan} ${tahun} — Jasa Medis: Rp ${jaspelBulan.toLocaleString('id-ID')}`);
    }

    // Simpan ke database di background
    try {
      await saveSettings(updatedSettings);
    } catch (err) {
      console.error("Gagal sinkronisasi bulan aktif ke cloud:", err);
    }
  };

  // Ganti tahun aktif → update totalDanaJaspel otomatis
  const _handleTahunChange = async (tahun) => {
    const bulan = settings?.bulanAktif || 'JANUARI';
    const compoundKey = `${tahun}_${bulan}`;

    // Cari nilai Kapitasi dan SILPA di settings, fallback ke master data
    const mKapitasi = (settings && settings.monthlyKapitasi && settings.monthlyKapitasi[compoundKey] !== undefined)
      ? settings.monthlyKapitasi[compoundKey]
      : (tahun === '2026' && settings?.monthlyKapitasi?.[bulan] !== undefined
         ? settings.monthlyKapitasi[bulan]
         : (tahun === '2026' && MONTHLY_JASPEL[bulan] ? Math.round(MONTHLY_JASPEL[bulan] / 0.75) : 0));
      
    const jaspelBulan = Math.round(mKapitasi * 0.60);
    
    const updatedSettings = { 
      ...settings, 
      tahunAktif: tahun, 
      totalDanaJaspel: jaspelBulan,
      silpaJasaMedis: 0
    };
    
    // Optimistic update
    setSettings(updatedSettings);
    
    if (jaspelBulan === 0) {
      showToast(`Tahun diubah ke ${tahun} (${bulan}). Silakan isi Dana Kapitasi di menu Pengaturan.`, 'error');
    } else {
      showToast(`Tahun diubah ke ${tahun} (${bulan}) — Jasa Medis: Rp ${jaspelBulan.toLocaleString('id-ID')}`);
    }

    // Simpan ke database di background
    try {
      await saveSettings(updatedSettings);
    } catch (err) {
      console.error("Gagal sinkronisasi tahun aktif ke cloud:", err);
    }
  };

  // Save Firebase Config
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    const isSuccess = saveFirebaseConfig(firebaseConfig);
    if (isSuccess) {
      setFirebaseConnected(true);
      showToast('Firebase berhasil terhubung!');
      setShowFirebaseModal(false);
      loadData();
    } else {
      showToast('Gagal terhubung! Cek konfigurasi Anda.', 'error');
    }
  };

  // Disconnect Firebase
  const handleDisconnectFirebase = () => {
    saveFirebaseConfig(null);
    setFirebaseConnected(false);
    setFirebaseConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    showToast('Koneksi Firebase diputuskan. Berjalan di Mode Lokal.');
  };

  // Export spreadsheet as professional Excel (.xlsx) file with proper grid lines and borders
  const handleExportExcel = async () => {
    if (!calculatedEmployees.length) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const sheetName = `Jasa Medis ${settings?.bulanAktif || 'JANUARI'}`.slice(0, 31);
      const worksheet = workbook.addWorksheet(sheetName, {
        views: [{ showGridLines: true }] // Ensure Excel gridlines are active
      });

      // 1. Add Header / Title Rows
      worksheet.addRow(["DAFTAR PERHITUNGAN JASA MEDIS JKN"]);
      worksheet.addRow(["UPTD PUSKESMAS MOLIBAGU"]);
      worksheet.addRow([`Periode: ${settings?.bulanAktif || 'JANUARI'} ${settings?.tahunAktif || '2026'}`]);
      worksheet.addRow([`Total Dana Jasa Medis Dibagikan: Rp ${new Intl.NumberFormat('id-ID').format(settings?.totalDanaJaspel || 0)}`]);
      worksheet.addRow([]); // Spacer

      // Style Title Row fonts
      worksheet.getRow(1).font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1F2937' } };
      worksheet.getRow(2).font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF4B5563' } };
      worksheet.getRow(3).font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF4B5563' } };
      worksheet.getRow(4).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF10B981' } }; // Beautiful emerald

      // 2. Add Table Column Headers Row (Row 6)
      const headerRow = worksheet.addRow([
        "NO", 
        "NAMA PEGAWAI", 
        "NIP", 
        "GOLONGAN", 
        "MASA KERJA (TAHUN)", 
        "TUGAS TAMBAHAN", 
        "HARI MASUK", 
        "HARI EFEKTIF", 
        "INDEKS KEHADIRAN", 
        "BOBOT GOLONGAN", 
        "BOBOT MASA KERJA", 
        "BOBOT TUGAS TAMBAHAN", 
        "TOTAL POIN", 
        "SPJ BRUTO (RP)", 
        "TARIF PPH21 (%)", 
        "PAJAK PPH21 (RP)", 
        "SPJ BERSIH (RP)"
      ]);

      // Style Table Header (Emerald Green Background with white text and solid borders)
      headerRow.height = 28;
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF059669' } // Darker emerald green
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF047857' } },
          left: { style: 'thin', color: { argb: 'FF047857' } },
          bottom: { style: 'medium', color: { argb: 'FF047857' } },
          right: { style: 'thin', color: { argb: 'FF047857' } }
        };
      });

      // 3. Add Employee Data Rows
      calculatedEmployees.forEach((emp, idx) => {
        const row = worksheet.addRow([
          idx + 1,
          emp.nama,
          emp.nip ? String(emp.nip) : '-',
          emp.golongan,
          Number(emp.masaKerja) || 0,
          emp.tugasTambahan || '-',
          emp.hariMasuk,
          emp.hariEfektif,
          Number(emp.presenceIndex.toFixed(4)),
          emp.golPoints,
          emp.mkPoints,
          emp.ttPoints,
          emp.finalPoints,
          emp.bruto,
          emp.taxRate,
          emp.taxAmount,
          emp.spjBersih
        ]);

        row.height = 20;

        // Apply Borders and Alignments to each cell in the row
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Arial', size: 9.5 };
          
          // Thin grid border for standard table display
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
            right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
          };

          // Columns alignments and formatting
          if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (colNumber === 2 || colNumber === 3 || colNumber === 6) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
          } else if (colNumber === 4) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else if (colNumber === 5) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0.00';
          } else if (colNumber === 7 || colNumber === 8) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          } else if (colNumber === 9) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '0.0000';
          } else if (colNumber >= 10 && colNumber <= 13) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0.00';
          } else if (colNumber === 14 || colNumber === 16 || colNumber === 17) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '"Rp"#,##0';
          } else if (colNumber === 15) {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '0"%"';
          }
        });
      });

      // 4. Add Total Row
      const totalRow = worksheet.addRow([
        "",
        "TOTAL SELURUH",
        "",
        "",
        "",
        "",
        totals.totalHariMasuk,
        "",
        "",
        "",
        "",
        "",
        totals.totalPoin,
        totals.totalBruto,
        "",
        totals.totalTax,
        totals.totalNetto
      ]);

      totalRow.height = 24;

      // Style Total Row (Gray background, double border bottom, bold fonts)
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 9.5, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF3F4F6' } // Light gray background
        };

        // Accounting style borders for totals
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF9CA3AF' } },
          left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
          bottom: { style: 'double', color: { argb: 'FF374151' } }, // Double line bottom is accounting standard
          right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
        };

        if (colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colNumber === 7) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else if (colNumber === 13) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '#,##0.00';
        } else if (colNumber === 14 || colNumber === 16 || colNumber === 17) {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          cell.numFmt = '"Rp"#,##0';
        }
      });

      // 5. Set column widths dynamically or via a nice preset array
      const colWidths = [6, 32, 22, 12, 18, 25, 12, 12, 18, 15, 18, 22, 12, 18, 15, 18, 18];
      colWidths.forEach((width, index) => {
        worksheet.getColumn(index + 1).width = width;
      });

      // 6. Write to buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `SPJ_Jasa_Medis_Puskesmas_Molibagu_${settings?.bulanAktif || 'JAN'}_${settings?.tahunAktif || '2026'}_${dateStr}.xlsx`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('File Excel (.xlsx) dengan tabel rapi berhasil diunduh!');
    } catch (error) {
      console.error('Gagal mengekspor file Excel:', error);
      showToast('Gagal mengekspor file Excel', 'error');
    }
  };

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    return calculatedEmployees.filter(emp =>
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [calculatedEmployees, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col font-sans select-none antialiased bg-white">

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${toastMessage.type === 'error'
          ? 'bg-rose-50 border-rose-100 text-rose-800'
          : 'bg-emerald-50 border-emerald-100 text-emerald-800'
          }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span className="text-sm font-medium">{toastMessage.text}</span>
        </div>
      )}

      {isLocked ? (
        <LockScreen
          passwordInput={passwordInput}
          setPasswordInput={setPasswordInput}
          handleLogin={handleLogin}
          authError={authError}
        />
      ) : (
        <div className="flex-1 flex flex-col w-full animate-fade-in">
          
          {/* Main Unified Dashboard Card (Full-width, borderless edge-to-edge layout) */}
          <div className="bg-white flex-1 flex flex-col">
            
            {/* Top Navbar */}
            <DashboardHeader
              isFirebaseConnected={isFirebaseConnected()}
              onOpenSettings={() => setShowSettingsModal(true)}
              onLogout={handleLogout}
              settings={settings}
              sidebarOpen={sidebarOpen}
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Sidebar + Main Content Row */}
            <div className="flex-1 flex flex-col lg:flex-row border-t border-neutral-100 items-stretch bg-neutral-50/10">
              
              {/* Collapsible Sidebar with Integrated Alokasi & Realisasi */}
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                showStats={showStats}
                onToggleStats={() => {
                  if (!sidebarOpen) {
                    setSidebarOpen(true);
                    setShowStats(true);
                  } else {
                    setShowStats(!showStats);
                  }
                }}
                settings={settings}
                totals={totals}
                onOpenSettings={() => setShowSettingsModal(true)}
                bulanAktif={settings?.bulanAktif || 'JANUARI'}
                onBulanChange={handleBulanChange}
              />

              {/* Main Content Area: Tabel Pegawai + Alerts */}
              <div className="flex-1 p-4 md:p-6 min-w-0 w-full flex flex-col gap-6 bg-[#fafafa]">
                
                {settings && (!settings.totalDanaJaspel || settings.totalDanaJaspel === 0) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 animate-pulse">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold">Periode Baru Terpilih: {settings.bulanAktif || 'JANUARI'} {settings.tahunAktif || '2026'}</h4>
                      <p className="text-xs font-semibold leading-relaxed">
                        Belum ada data keuangan untuk bulan ini (Dana Jasa Medis masih Rp 0). 
                        Silakan klik tombol <strong className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-950 font-bold border border-amber-300">Pengaturan</strong> di kanan atas untuk memasukkan <strong>Total Dana Kapitasi Diterima (100%)</strong> agar sistem dapat menghitung pembagian Jasa Medis secara otomatis!
                      </p>
                    </div>
                  </div>
                )}

                <EmployeeTable
                  employees={filteredEmployees}
                  onAttendanceChange={handleAttendanceChange}
                  onEditEmployee={setEditingEmployee}
                  onDeleteEmployee={handleDelete}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  onAddClick={() => setShowAddModal(true)}
                  onExportExcel={handleExportExcel}
                  loading={loading}
                  totals={totals}
                />

                <footer className="text-center text-[11px] text-neutral-400 font-bold tracking-wider py-4 mt-auto">
                  SISTEM INVENTARISASI DANA KAPITASI • PUSKESMAS MOLIBAGU v1.0.0
                </footer>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddEmployee}
        newEmployee={newEmployee}
        setNewEmployee={setNewEmployee}
        settings={settings}
      />

      {/* Edit Employee Details Modal */}
      <EditEmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSubmit={handleUpdateEmployeeDetails}
        editingEmployee={editingEmployee}
        setEditingEmployee={setEditingEmployee}
        settings={settings}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSubmit={handleSaveSettings}
        settings={settings}
        setSettings={setSettings}
      />

      {/* Firebase Config Modal */}
      <FirebaseModal
        isOpen={showFirebaseModal}
        onClose={() => setShowFirebaseModal(false)}
        onSubmit={handleSaveFirebase}
        firebaseConfig={firebaseConfig}
        setFirebaseConfig={setFirebaseConfig}
        isFirebaseConnected={isFirebaseConnected()}
        onDisconnect={handleDisconnectFirebase}
      />

    </div>
  );
}

export default App;

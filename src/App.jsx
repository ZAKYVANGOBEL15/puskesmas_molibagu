import { useState, useEffect, useMemo } from 'react';
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
  MONTHLY_JASPEL
} from './dbService';

// Import Modular Components
import LockScreen from './components/LockScreen';
import DashboardHeader from './components/DashboardHeader';
import StatsBar from './components/StatsBar';
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

  // Selected employee for editing
  const [editingEmployee, setEditingEmployee] = useState(null);

  // New Employee Form State
  const [newEmployee, setNewEmployee] = useState({
    nama: '',
    nip: '',
    golongan: 'III/a',
    pendidikan: 'S1 Kesehatan (SKM, S.Kep, S.Keb)',
    masaKerja: 0,
    tugasTambahan: 'Staf / Pelaksana',
    hariMasuk: 22,
    hariEfektif: 22
  });

  // Load configuration & data
  useEffect(() => {
    if (!isLocked) {
      loadData();
    }
  }, [isLocked]);

  const loadData = async () => {
    setLoading(true);
    try {
      const dbSettings = await fetchSettings();
      const dbEmployees = await fetchEmployees();

      // Jika totalDanaJaspel belum diset (pertama kali), isi dari MONTHLY_JASPEL
      // Tapi JANGAN override jika user sudah set manual — biarkan user settings yang menang
      if (dbSettings && dbSettings.bulanAktif && !dbSettings.totalDanaJaspel) {
        const masterJaspel = MONTHLY_JASPEL[dbSettings.bulanAktif] || 0;
        if (masterJaspel > 0) {
          dbSettings.totalDanaJaspel = masterJaspel;
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

    const updated = employees.map(emp => {
      if (emp.id === empId) {
        const subFieldName = field === 'hariMasuk' ? 'hariMasukPerBulan' : 'hariEfektifPerBulan';
        const currentMap = emp[subFieldName] || {};
        return {
          ...emp,
          [subFieldName]: { ...currentMap, [bulan]: value },
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
    if (!newEmployee.nama || !newEmployee.nip) {
      showToast('Nama dan NIP/Identitas wajib diisi!', 'error');
      return;
    }

    try {
      const updated = await saveEmployee({
        ...newEmployee,
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
        pendidikan: 'S1 Kesehatan (SKM, S.Kep, S.Keb)',
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

  // Ganti bulan aktif → update totalDanaJaspel otomatis dari Data Master
  const handleBulanChange = async (bulan) => {
    const jaspelBulan = MONTHLY_JASPEL[bulan] || 0;
    if (jaspelBulan === 0) {
      showToast(`Data bulan ${bulan} belum tersedia.`, 'error');
      return;
    }
    const updatedSettings = { ...settings, bulanAktif: bulan, totalDanaJaspel: jaspelBulan };
    
    // Optimistic update: ganti di UI secara instan agar tidak beku
    setSettings(updatedSettings);
    showToast(`Periode diubah ke ${bulan} — Jaspel: Rp ${jaspelBulan.toLocaleString('id-ID')}`);

    // Simpan ke database di background
    try {
      await saveSettings(updatedSettings);
    } catch (err) {
      console.error("Gagal sinkronisasi bulan aktif ke cloud:", err);
    }
  };

  // Save Firebase Config
  const handleSaveFirebase = (e) => {
    e.preventDefault();
    const isSuccess = saveFirebaseConfig(firebaseConfig);
    if (isSuccess) {
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
    setFirebaseConfig({
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: ''
    });
    showToast('Koneksi Firebase diputuskan. Berjalan di Mode Lokal.');
    setShowFirebaseModal(false);
    loadData();
  };

  // Export spreadsheet as CSV
  const handleExportCSV = () => {
    if (!calculatedEmployees.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "NO,NAMA,NIP,GOLONGAN,MASA KERJA (TAHUN),TUGAS TAMBAHAN,HARI MASUK,HARI EFEKTIF,INDEKS KEHADIRAN,BOBOT GOLONGAN,BOBOT MASA KERJA,BOBOT TUGAS TAMBAHAN,TOTAL POIN,BRUTO (RP),RATE PPH21 (%),PAJAK PPH21 (RP),SPJ BERSIH (RP)\r\n";

    calculatedEmployees.forEach((emp, idx) => {
      const row = [
        idx + 1,
        `"${emp.nama.replace(/"/g, '""')}"`,
        `"${emp.nip}"`,
        emp.golongan,
        emp.masaKerja,
        `"${emp.tugasTambahan}"`,
        emp.hariMasuk,
        emp.hariEfektif,
        emp.presenceIndex.toFixed(4),
        emp.golPoints,
        emp.mkPoints,
        emp.ttPoints,
        emp.finalPoints,
        emp.bruto,
        emp.taxRate,
        emp.taxAmount,
        emp.spjBersih
      ].join(",");
      csvContent += row + "\r\n";
    });

    csvContent += `,,,TOTAL,,,,,,,,,${totals.totalPoin},${totals.totalBruto},,${totals.totalTax},${totals.totalNetto}\r\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `SPJ_Jaspel_Puskesmas_Molibagu_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Spreadsheet berhasil diexport ke CSV!');
  };

  // Filter employees based on search query
  const filteredEmployees = useMemo(() => {
    return calculatedEmployees.filter(emp =>
      emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nip.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [calculatedEmployees, searchQuery]);

  return (
    <div className="min-height-100svh flex flex-col font-sans select-none antialiased bg-[#fafafa]">

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
        <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6 animate-fade-in">

          <DashboardHeader
            isFirebaseConnected={isFirebaseConnected()}
            onOpenFirebase={() => setShowFirebaseModal(true)}
            onOpenSettings={() => setShowSettingsModal(true)}
            onLogout={handleLogout}
            bulanAktif={settings?.bulanAktif || 'JANUARI'}
            onBulanChange={handleBulanChange}
          />

          <StatsBar
            settings={settings}
            totals={totals}
            onOpenSettings={() => setShowSettingsModal(true)}
          />

          <EmployeeTable
            employees={filteredEmployees}
            onAttendanceChange={handleAttendanceChange}
            onEditEmployee={setEditingEmployee}
            onDeleteEmployee={handleDelete}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onAddClick={() => setShowAddModal(true)}
            onExportCSV={handleExportCSV}
            loading={loading}
            totals={totals}
          />

          <footer className="text-center text-[11px] text-neutral-400 font-semibold tracking-wider pt-6">
            SISTEM INVENTARISASI DANA KAPITASI • PUSKESMAS MOLIBAGU v1.0.0
          </footer>
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

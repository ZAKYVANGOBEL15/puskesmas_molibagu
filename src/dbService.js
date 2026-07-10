import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Monthly Jaspel data from Data Master (calculated using the H8 cell value from Excel sheets which is 75% of Kapitasi)
export const MONTHLY_JASPEL = {
  'JANUARI':  65000166,
  'FEBRUARI': 57606349,
  'MARET':    61188047,
  'APRIL':    51465059,
  'MEI':      51373776,
  'JUNI':     0,
  'JULI':     0,
  'AGUSTUS':  0,
  'SEPTEMBER':0,
  'OKTOBER':  0,
  'NOVEMBER': 0,
  'DESEMBER': 0
};

// Default initial settings based on real PMK 6 / Excel values
const DEFAULT_SETTINGS = {
  password: 'jm',            // Password login ke dasbor
  totalDanaJaspel: 52000132, // Jasa Medis 60% - JANUARI (dari Data Master)
  bulanAktif: 'JANUARI',    // Bulan yang sedang dihitung
  hariEfektifDefault: 22,
  hariEfektifPerBulan: {
    "JANUARI": 22,
    "FEBRUARI": 20,
    "MARET": 22,
    "APRIL": 25,
    "MEI": 20, // Mei = 20 hari kerja efektif
    "JUNI": 22,
    "JULI": 22,
    "AGUSTUS": 22,
    "SEPTEMBER": 22,
    "OKTOBER": 22,
    "NOVEMBER": 22,
    "DESEMBER": 22
  },
  poinMasaKerjaMultiplier: 0, // 0 means use the table-based ranges by default
  poinPendidikan: {
    'Dokter Spesialis / Dokter / Dokter Gigi': 150,
    'S1 Ners / Apoteker': 100,
    'S1 Kesehatan (SKM, S.Kep, S.Keb)': 80,
    'D3 Kesehatan (A.Md.Kep, A.Md.Keb, dll)': 60,
    'Staf Non-Kesehatan (SMA / D3 / S1 Adm)': 30
  },
  poinGolongan: {
    'IV/a': 0, 'IV/b': 0, 'IV/c': 0, 'IV/d': 0, 'IV/e': 0,
    'III/a': 0, 'III/b': 0, 'III/c': 0, 'III/d': 0,
    'II/a': 0, 'II/b': 0, 'II/c': 0, 'II/d': 0,
    'Non-PNS': 0
  },
  poinTugasTambahan: {
    'Kepala Puskesmas': 100,
    'Tata Usaha': 30,
    'Bendahara JKN': 50,
    'Penanggung Jawab UKM/UKP': 15,
    'Staf / Pelaksana': 0
  },
  pph21Rates: {
    'Golongan IV': 15,
    'Golongan III': 5,
    'Golongan II': 0,
    'Golongan I': 0,
    'Non-PNS': 0
  }
};

// Try to initialize Firebase
let db = null;
let auth = null;
let isFirebaseActive = false;

export function getStoredFirebaseConfig() {
  const localConfig = localStorage.getItem('molibagu_firebase_config');
  if (localConfig) {
    try {
      return JSON.parse(localConfig);
    } catch (e) {
      return null;
    }
  }
  
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };
  }
  return null;
}

export function initializeFirebaseService() {
  const config = getStoredFirebaseConfig();
  if (config && config.apiKey) {
    try {
      const app = initializeApp(config);
      db = getFirestore(app);
      auth = getAuth(app);
      isFirebaseActive = true;
      // Auto sign-in anonymously so Firestore rules (request.auth != null) are satisfied
      signInAnonymously(auth)
        .then(() => console.log('Firebase: Anonymous auth success.'))
        .catch(err => console.warn('Firebase: Anonymous auth failed:', err));
      console.log('Firebase initialized successfully!');
      return true;
    } catch (err) {
      console.error('Failed to initialize Firebase:', err);
      db = null;
      auth = null;
      isFirebaseActive = false;
      return false;
    }
  }
  db = null;
  auth = null;
  isFirebaseActive = false;
  return false;
}

// Initial initialization attempt
initializeFirebaseService();

export function isFirebaseConnected() {
  return isFirebaseActive;
}

export function saveFirebaseConfig(config) {
  if (config) {
    localStorage.setItem('molibagu_firebase_config', JSON.stringify(config));
  } else {
    localStorage.removeItem('molibagu_firebase_config');
  }
  return initializeFirebaseService();
}

// DATABASE OPERATIONS WITH FALLBACK

// 1. Settings operations
// Sync settings from Firebase to localStorage silently in background
function syncSettingsFromFirebase() {
  if (!isFirebaseActive || !db) return;
  getDocs(collection(db, 'settings')).then(snap => {
    if (!snap.empty) {
      const firebaseData = { ...DEFAULT_SETTINGS, ...snap.docs[0].data() };
      localStorage.setItem('molibagu_settings', JSON.stringify(firebaseData));
    }
  }).catch(() => {});
}

export async function fetchSettings() {
  // CACHE-FIRST: Return localStorage data instantly
  const local = localStorage.getItem('molibagu_settings');
  let localSettings = DEFAULT_SETTINGS;
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.hasOwnProperty('poinPendidikan')) {
        localSettings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {}
  } else {
    localStorage.setItem('molibagu_settings', JSON.stringify(DEFAULT_SETTINGS));
  }

  // Sync from Firebase silently in background (non-blocking)
  syncSettingsFromFirebase();

  return localSettings;
}

export async function saveSettings(settings) {
  const mergedSettings = { ...DEFAULT_SETTINGS, ...settings };
  localStorage.setItem('molibagu_settings', JSON.stringify(mergedSettings));
  
  if (isFirebaseActive && db) {
    setDoc(doc(db, 'settings', 'config'), mergedSettings).catch(e => {
      console.error('Firebase error saving settings:', e);
    });
  }
  return mergedSettings;
}

// 2. Employees (Pegawai) operations
// Sync employees from Firebase to localStorage silently in background
function syncEmployeesFromFirebase() {
  if (!isFirebaseActive || !db) return;
  getDocs(collection(db, 'employees')).then(snap => {
    if (!snap.empty) {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      localStorage.setItem('molibagu_employees', JSON.stringify(list));
    } else {
      // Firebase empty: seed from local data
      const local = localStorage.getItem('molibagu_employees');
      let initialList = [];
      if (local) { try { initialList = JSON.parse(local); } catch(e) {} }
      if (!initialList || initialList.length === 0) {
        // Data tidak tersedia — abaikan, data akan diinput manual
        return;
      }
    }
  }).catch(() => {});
}

export async function fetchEmployees() {
  // CACHE-FIRST: Return localStorage data instantly
  const local = localStorage.getItem('molibagu_employees');
  let localList = [];
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && parsed.length > 0) {
        const isSchemaV3 = parsed.every(emp =>
          emp.hasOwnProperty('pendidikan') &&
          emp.hasOwnProperty('masaKerjaPerBulan') &&
          emp.hasOwnProperty('hariMasukPerBulan')
        );
        localList = isSchemaV3 ? parsed : parsed.map(emp => ({
          ...emp,
          hariMasukPerBulan: emp.hariMasukPerBulan || { "JANUARI": emp.hariMasuk || 22, "FEBRUARI": emp.hariMasuk || 20, "MARET": emp.hariMasuk || 22, "APRIL": emp.hariMasuk || 25, "MEI": emp.hariMasuk || 22 },
          hariEfektifPerBulan: emp.hariEfektifPerBulan || { "JANUARI": emp.hariEfektif || 22, "FEBRUARI": emp.hariEfektif || 20, "MARET": emp.hariEfektif || 22, "APRIL": emp.hariEfektif || 25, "MEI": emp.hariEfektif || 22 }
        }));
      }
    } catch(e) {}
  }

  // Sync from Firebase silently in background (non-blocking)
  syncEmployeesFromFirebase();

  if (localList.length > 0) {
    return localList.sort((a, b) => (a.no || 99) - (b.no || 99));
  }
  
  // Tidak ada data lokal dan Firebase belum sinkron — kembalikan array kosong
  return [];
}

export async function saveEmployee(employee) {
  const employees = await fetchEmployees();
  let updatedEmployees;
  
  if (employee.id) {
    updatedEmployees = employees.map(emp => emp.id === employee.id ? employee : emp);
  } else {
    const newEmp = {
      ...employee,
      id: 'emp_' + Math.random().toString(36).substr(2, 9),
      no: employees.length + 1
    };
    updatedEmployees = [...employees, newEmp];
    employee.id = newEmp.id;
    employee.no = newEmp.no;
  }
  
  updatedEmployees = updatedEmployees.map((emp, idx) => ({ ...emp, no: idx + 1 }));
  localStorage.setItem('molibagu_employees', JSON.stringify(updatedEmployees));
  
  if (isFirebaseActive && db) {
    (async () => {
      try {
        await setDoc(doc(db, 'employees', employee.id), employee);
        const batch = writeBatch(db);
        updatedEmployees.forEach(emp => {
          batch.set(doc(db, 'employees', emp.id), emp);
        });
        await batch.commit();
      } catch (e) {
        console.error('Firebase error saving employee:', e);
      }
    })();
  }
  
  return updatedEmployees;
}

export async function deleteEmployee(id) {
  const employees = await fetchEmployees();
  let updatedEmployees = employees.filter(emp => emp.id !== id);
  
  updatedEmployees = updatedEmployees.map((emp, idx) => ({ ...emp, no: idx + 1 }));
  localStorage.setItem('molibagu_employees', JSON.stringify(updatedEmployees));
  
  if (isFirebaseActive && db) {
    (async () => {
      try {
        await deleteDoc(doc(db, 'employees', id));
        const batch = writeBatch(db);
        updatedEmployees.forEach(emp => {
          batch.set(doc(db, 'employees', emp.id), emp);
        });
        await batch.commit();
      } catch (e) {
        console.error('Firebase error deleting employee:', e);
      }
    })();
  }
  
  return updatedEmployees;
}

export async function saveEmployeesBatch(updatedEmployees) {
  localStorage.setItem('molibagu_employees', JSON.stringify(updatedEmployees));
  
  if (isFirebaseActive && db) {
    (async () => {
      try {
        const batch = writeBatch(db);
        updatedEmployees.forEach(emp => {
          batch.set(doc(db, 'employees', emp.id), emp);
        });
        await batch.commit();
      } catch (e) {
        console.error('Firebase error saving batch:', e);
      }
    })();
  }
  return updatedEmployees;
}

// 3. Mathematical calculation logic
export function calculateJaspel(employees, settings) {
  const { totalDanaJaspel, poinPendidikan, poinTugasTambahan, pph21Rates, bulanAktif } = settings;
  const bulan = bulanAktif || 'JANUARI';
  
  // Step 1: Calculate points for each employee
  const employeesWithPoints = employees.map(emp => {
    // 1. Get Poin Pendidikan / Profesi
    const eduPoints = poinPendidikan[emp.pendidikan] || 30;
    
    // 2. Pick Masa Kerja for the active month, fallback to emp.masaKerja
    const masaKerjaBulanIni = (emp.masaKerjaPerBulan && emp.masaKerjaPerBulan[bulan] != null)
      ? emp.masaKerjaPerBulan[bulan]
      : (emp.masaKerja || 0);
    
    // 3. Get Poin Masa Kerja (Range-based table per Excel PMK)
    const years = Math.floor(masaKerjaBulanIni);
    let mkPoints = 2;
    if (years >= 31) mkPoints = 25;
    else if (years >= 21) mkPoints = 20;
    else if (years >= 16) mkPoints = 15;
    else if (years >= 11) mkPoints = 10;
    else if (years >= 5) mkPoints = 5;
    else mkPoints = 2;
    
    // 4. Get Poin Tugas Tambahan
    const ttPoints = poinTugasTambahan[emp.tugasTambahan] || 0;
    
    // 5. Calculate Attendance Index per month
    const hariMasukBulanIni = (emp.hariMasukPerBulan && emp.hariMasukPerBulan[bulan] != null)
      ? emp.hariMasukPerBulan[bulan]
      : (emp.hariMasuk != null ? emp.hariMasuk : settings.hariEfektifDefault);
      
    // Hari Efektif selalu dari Settings per bulan aktif (dikunci, berlaku global untuk semua pegawai)
    const hariEfektifBulanIni = (settings.hariEfektifPerBulan && settings.hariEfektifPerBulan[bulan] != null)
      ? settings.hariEfektifPerBulan[bulan]
      : (settings.hariEfektifDefault || 22);
    
    const presenceIndex = hariEfektifBulanIni > 0 ? (hariMasukBulanIni / hariEfektifBulanIni) : 0;
    
    // 6. Final Points = (Pendidikan + MasaKerja + TugasTambahan) * Kehadiran
    const basePoints = eduPoints + mkPoints + ttPoints;
    const finalPoints = Number((basePoints * presenceIndex).toFixed(3));
    
    return {
      ...emp,
      masaKerja: masaKerjaBulanIni, // tampilkan masa kerja bulan aktif di tabel
      hariMasuk: hariMasukBulanIni, // tampilkan hari masuk bulan aktif di tabel
      hariEfektif: hariEfektifBulanIni, // tampilkan hari efektif bulan aktif di tabel
      eduPoints,
      mkPoints,
      ttPoints,
      presenceIndex,
      finalPoints
    };
  });
  
  // Step 2: Sum all employee points
  const totalPointsAll = employeesWithPoints.reduce((sum, emp) => sum + emp.finalPoints, 0);
  
  // Step 3: Calculate Bruto, Pajak, and SPJ Bersih
  return employeesWithPoints.map(emp => {
    const bruto = totalPointsAll > 0 ? (emp.finalPoints / totalPointsAll) * totalDanaJaspel : 0;
    
    let pphGroup = 'Non-PNS';
    if (emp.golongan.startsWith('IV')) {
      pphGroup = 'Golongan IV';
    } else if (emp.golongan.startsWith('III')) {
      pphGroup = 'Golongan III';
    } else if (emp.golongan.startsWith('II')) {
      pphGroup = 'Golongan II';
    } else if (emp.golongan.startsWith('I/')) {
      pphGroup = 'Golongan I';
    }
    
    const taxRate = pph21Rates[pphGroup] !== undefined ? pph21Rates[pphGroup] : 0;
    const taxAmount = (bruto * taxRate) / 100;
    const netAmount = bruto - taxAmount;
    
    return {
      ...emp,
      bruto: Math.round(bruto),
      taxRate,
      taxAmount: Math.round(taxAmount),
      spjBersih: Math.round(netAmount)
    };
  });
}
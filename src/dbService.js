import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  onSnapshot
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
  totalDanaJaspel: 52000133, // Total Dana Jasa Medis aktif (60% dari Kapitasi Jan)
  bulanAktif: 'JANUARI',    // Bulan yang sedang dihitung
  tahunAktif: '2026',        // Tahun aktif default
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
  monthlyKapitasi: {
    'JANUARI':  86666888,
    'FEBRUARI': 76808465,
    'MARET':    81584063,
    'APRIL':    68620079,
    'MEI':      68498368,
    'JUNI':     0,
    'JULI':     0,
    'AGUSTUS':  0,
    'SEPTEMBER':0,
    'OKTOBER':  0,
    'NOVEMBER': 0,
    'DESEMBER': 0
  },
  monthlySilpa: {
    'JANUARI':  0,
    'FEBRUARI': 0,
    'MARET':    0,
    'APRIL':    0,
    'MEI':      0,
    'JUNI':     0,
    'JULI':     0,
    'AGUSTUS':  0,
    'SEPTEMBER':0,
    'OKTOBER':  0,
    'NOVEMBER': 0,
    'DESEMBER': 0
  },
  poinMasaKerjaMultiplier: 0, // 0 means use the table-based ranges by default
  poinPendidikan: {
    'D3': 60,
    'D3/NON-KES': 50,
    'D3/PENSUS-NS': 30,
    'D4': 80,
    'D4/NON-KES': 60,
    'S1': 80,
    'S1/NERS': 100,
    'S1 / GZ': 80,
    'S1/NON-KES': 60,
    'AST-KES': 50,
    'S1/DOKTER': 150,
    'S1/DOKTER-NS': 75,
    'S1/APOTEKER': 100,
    'SMA': 25,
    'SMK': 25,
    'D3/NON-STR': 15,
    'D3/STR-ED': 30,
    'D4/NON-STR': 15,
    'D4/STR-ED': 30,
    'S1/NON-STR': 15,
    'S1/STR-ED': 30,
    'S1/PENSUS-NS': 50,
    'PROG-INTERN': 75
  },
  poinGolongan: {
    'IV': 0,
    'III': 0,
    'II': 0,
    'I': 0,
    'IX': 0,
    'VIII': 0,
    'VII': 0,
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

function filterPoinPendidikan(data) {
  const filtered = {};
  for (const key of Object.keys(DEFAULT_SETTINGS.poinPendidikan)) {
    if (data && data[key] !== undefined) {
      filtered[key] = data[key];
    } else {
      filtered[key] = DEFAULT_SETTINGS.poinPendidikan[key];
    }
  }
  return filtered;
}

function filterPoinGolongan(data) {
  const filtered = {};
  for (const key of Object.keys(DEFAULT_SETTINGS.poinGolongan)) {
    if (data && data[key] !== undefined) {
      filtered[key] = data[key];
    } else {
      filtered[key] = DEFAULT_SETTINGS.poinGolongan[key];
    }
  }
  return filtered;
}

function filterPoinTugasTambahan(data) {
  if (!data || Object.keys(data).length === 0) {
    return { ...DEFAULT_SETTINGS.poinTugasTambahan };
  }
  return { ...data };
}

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
        .catch(err => console.warn('Firebase: Anonymous auth failed:', err));
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
      const snapData = snap.docs[0].data() || {};
      const firebaseData = {
        ...DEFAULT_SETTINGS,
        ...snapData,
        poinPendidikan: filterPoinPendidikan(snapData.poinPendidikan),
        poinGolongan: filterPoinGolongan(snapData.poinGolongan),
        poinTugasTambahan: filterPoinTugasTambahan(snapData.poinTugasTambahan),
        pph21Rates: {
          ...DEFAULT_SETTINGS.pph21Rates,
          ...(snapData.pph21Rates || {})
        },
        monthlyKapitasi: {
          ...DEFAULT_SETTINGS.monthlyKapitasi,
          ...(snapData.monthlyKapitasi || {})
        },
        monthlySilpa: {
          ...DEFAULT_SETTINGS.monthlySilpa,
          ...(snapData.monthlySilpa || {})
        }
      };
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
        localSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          poinPendidikan: filterPoinPendidikan(parsed.poinPendidikan),
          poinGolongan: filterPoinGolongan(parsed.poinGolongan),
          poinTugasTambahan: filterPoinTugasTambahan(parsed.poinTugasTambahan),
          pph21Rates: {
            ...DEFAULT_SETTINGS.pph21Rates,
            ...(parsed.pph21Rates || {})
          },
          monthlyKapitasi: {
            ...DEFAULT_SETTINGS.monthlyKapitasi,
            ...(parsed.monthlyKapitasi || {})
          },
          monthlySilpa: {
            ...DEFAULT_SETTINGS.monthlySilpa,
            ...(parsed.monthlySilpa || {})
          }
        };
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
  const mergedSettings = { 
    ...DEFAULT_SETTINGS, 
    ...settings,
    poinPendidikan: filterPoinPendidikan(settings?.poinPendidikan),
    poinGolongan: filterPoinGolongan(settings?.poinGolongan),
    poinTugasTambahan: filterPoinTugasTambahan(settings?.poinTugasTambahan)
  };
  localStorage.setItem('molibagu_settings', JSON.stringify(mergedSettings));
  
  if (isFirebaseActive && db) {
    setDoc(doc(db, 'settings', 'config'), mergedSettings).catch(e => {
      console.error('Firebase error saving settings:', e);
    });
  }
  return mergedSettings;
}

export function subscribeSettings(onUpdate) {
  if (isFirebaseActive && db) {
    return onSnapshot(collection(db, 'settings'), (snap) => {
      if (!snap.empty) {
        const configDoc = snap.docs.find(d => d.id === 'config') || snap.docs[0];
        const snapData = configDoc.data() || {};
        const firebaseData = {
          ...DEFAULT_SETTINGS,
          ...snapData,
          poinPendidikan: filterPoinPendidikan(snapData.poinPendidikan),
          poinGolongan: filterPoinGolongan(snapData.poinGolongan),
          poinTugasTambahan: filterPoinTugasTambahan(snapData.poinTugasTambahan),
          pph21Rates: {
            ...DEFAULT_SETTINGS.pph21Rates,
            ...(snapData.pph21Rates || {})
          },
          monthlyKapitasi: {
            ...DEFAULT_SETTINGS.monthlyKapitasi,
            ...(snapData.monthlyKapitasi || {})
          },
          monthlySilpa: {
            ...DEFAULT_SETTINGS.monthlySilpa,
            ...(snapData.monthlySilpa || {})
          }
        };
        localStorage.setItem('molibagu_settings', JSON.stringify(firebaseData));
        onUpdate(firebaseData);
      }
    }, (error) => {
      console.error('Firebase settings subscription error:', error);
    });
  }
  return null;
}

export function subscribeEmployees(onUpdate) {
  if (isFirebaseActive && db) {
    return onSnapshot(collection(db, 'employees'), async (snap) => {
      let needsCleanup = false;
      const cleanedDocs = [];
      const batch = writeBatch(db);

      snap.docs.forEach(d => {
        const data = d.data();
        if (data.nip && data.nip !== '-') {
          needsCleanup = true;
          const updated = { ...data, nip: '-' };
          batch.set(doc(db, 'employees', d.id), updated);
          cleanedDocs.push({ id: d.id, ...updated });
        } else {
          cleanedDocs.push({ id: d.id, ...data });
        }
      });

      if (needsCleanup) {
        try {
          await batch.commit();
        } catch (e) {
          console.error('Firebase: Failed to auto-cleanup NIP:', e);
        }
      }

      localStorage.setItem('molibagu_employees', JSON.stringify(cleanedDocs));
      const sorted = cleanedDocs.sort((a, b) => (a.no || 99) - (b.no || 99));
      onUpdate(sorted);
    }, (error) => {
      console.error('Firebase employees subscription error:', error);
    });
  }
  return null;
}

// 2. Employees (Pegawai) operations
// Sync employees from Firebase to localStorage silently in background, and automatically clean up/reset existing NIP values
function syncEmployeesFromFirebase() {
  if (!isFirebaseActive || !db) return;
  getDocs(collection(db, 'employees')).then(async (snap) => {
    if (!snap.empty) {
      let needsCleanup = false;
      const cleanedDocs = [];
      const batch = writeBatch(db);

      snap.docs.forEach(d => {
        const data = d.data();
        if (data.nip && data.nip !== '-') {
          needsCleanup = true;
          const updated = { ...data, nip: '-' };
          batch.set(doc(db, 'employees', d.id), updated);
          cleanedDocs.push({ id: d.id, ...updated });
        } else {
          cleanedDocs.push({ id: d.id, ...data });
        }
      });

      if (needsCleanup) {
        try {
          await batch.commit();
          console.log('Firebase: NIP database has been cleaned up successfully in background.');
        } catch (e) {
          console.error('Firebase: Failed to auto-cleanup NIP in background:', e);
        }
      }

      localStorage.setItem('molibagu_employees', JSON.stringify(cleanedDocs));
    }
  }).catch(() => {});
}

export async function fetchEmployees() {
  // CACHE-FIRST: Return localStorage data instantly
  const local = localStorage.getItem('molibagu_employees');
  let localList = [];
  if (local) {
    try {
      let parsed = JSON.parse(local);
      if (parsed && parsed.length > 0) {
        // Clean up NIP in local cache too
        let cacheChanged = false;
        parsed = parsed.map(emp => {
          if (emp.nip && emp.nip !== '-') {
            cacheChanged = true;
            return { ...emp, nip: '-' };
          }
          return emp;
        });
        if (cacheChanged) {
          localStorage.setItem('molibagu_employees', JSON.stringify(parsed));
        }

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
  const { totalDanaJaspel, poinPendidikan, poinGolongan = {}, poinTugasTambahan, pph21Rates, bulanAktif, tahunAktif } = settings;
  const bulan = bulanAktif || 'JANUARI';
  const tahun = tahunAktif || '2026';
  const compoundKey = `${tahun}_${bulan}`;
  
  // Step 1: Calculate raw points (basePoints) for each employee
  const employeesWithPoints = employees.map(emp => {
    // 1. Get Poin Pendidikan / Profesi (Jenis Ketenagaan)
    const eduPoints = poinPendidikan[emp.pendidikan] || 30;
    
    // 2. Pick Masa Kerja for the active month, fallback to emp.masaKerja
    const masaKerjaBulanIni = (emp.masaKerjaPerBulan && emp.masaKerjaPerBulan[compoundKey] != null)
      ? emp.masaKerjaPerBulan[compoundKey]
      : (emp.masaKerjaPerBulan && emp.masaKerjaPerBulan[bulan] != null && tahun === '2026'
          ? emp.masaKerjaPerBulan[bulan]
          : (emp.masaKerja || 0));
    
    // 3. Get Poin Masa Kerja (Range-based table per Excel PMK)
    const years = Math.floor(masaKerjaBulanIni);
    let mkPoints = 2;
    if (years >= 31) mkPoints = 25;
    else if (years >= 21) mkPoints = 20;
    else if (years >= 16) mkPoints = 15;
    else if (years >= 11) mkPoints = 10;
    else if (years >= 5) mkPoints = 5;
    else mkPoints = 2;
    
    // 4. Get Poin Tugas Tambahan (Rangkap Tugas Adm / Program)
    const ttPoints = poinTugasTambahan[emp.tugasTambahan] || 0;
    
    // 5. Get Poin Golongan (Optional)
    const golPoints = poinGolongan[emp.golongan] || 0;
    
    // 6. Calculate Attendance Index per month
    const hariMasukBulanIni = (emp.hariMasukPerBulan && emp.hariMasukPerBulan[compoundKey] != null)
      ? emp.hariMasukPerBulan[compoundKey]
      : (emp.hariMasukPerBulan && emp.hariMasukPerBulan[bulan] != null && tahun === '2026'
          ? emp.hariMasukPerBulan[bulan]
          : (emp.hariMasuk != null ? emp.hariMasuk : (settings.hariEfektifPerBulan?.[compoundKey] || settings.hariEfektifPerBulan?.[bulan] || settings.hariEfektifDefault || 22)));
      
    // Hari Efektif selalu dari Settings per bulan aktif (dikunci, berlaku global untuk semua pegawai)
    const hariEfektifBulanIni = (settings.hariEfektifPerBulan && settings.hariEfektifPerBulan[compoundKey] != null)
      ? settings.hariEfektifPerBulan[compoundKey]
      : (settings.hariEfektifPerBulan && settings.hariEfektifPerBulan[bulan] != null && tahun === '2026'
          ? settings.hariEfektifPerBulan[bulan]
          : (settings.hariEfektifDefault || 22));
    
    const presenceIndex = hariEfektifBulanIni > 0 ? (hariMasukBulanIni / hariEfektifBulanIni) : 0;
    
    // Base points = Pendidikan + Masa Kerja + Tugas Tambahan + Golongan (matches "Jumlah Point" in Excel)
    const basePoints = eduPoints + mkPoints + ttPoints + golPoints;
    
    return {
      ...emp,
      masaKerja: masaKerjaBulanIni, // tampilkan masa kerja bulan aktif di tabel
      hariMasuk: hariMasukBulanIni, // tampilkan hari masuk bulan aktif di tabel
      hariEfektif: hariEfektifBulanIni, // tampilkan hari efektif bulan aktif di tabel
      eduPoints,
      mkPoints,
      ttPoints,
      golPoints,
      presenceIndex,
      basePoints,
      finalPoints: basePoints // "Jumlah Point" represents raw points in Excel (un-discounted by presence yet)
    };
  });
  
  // Step 2: Sum all employee raw base points (Total Jumlah Seluruh Point - column 15 in Excel)
  const totalPointsAll = employeesWithPoints.reduce((sum, emp) => sum + emp.basePoints, 0);
  
  // Step 3: Calculate Bruto, Pajak, and SPJ Bersih based on Excel formula
  return employeesWithPoints.map(emp => {
    // Persentase % = basePoints / totalPointsAll
    const sharePercentage = totalPointsAll > 0 ? (emp.basePoints / totalPointsAll) : 0;
    
    // Bruto = Total Dana Jaspel * Persentase % * Kehadiran %
    const bruto = totalDanaJaspel * sharePercentage * emp.presenceIndex;
    
    let pphGroup = 'Non-PNS';
    const gol = emp.golongan || '';
    if (gol === 'IV' || gol.startsWith('IV/')) {
      pphGroup = 'Golongan IV';
    } else if (gol === 'III' || gol.startsWith('III/') || gol === 'IX' || gol === 'VIII' || gol === 'VII') {
      pphGroup = 'Golongan III';
    } else if (gol === 'II' || gol.startsWith('II/')) {
      pphGroup = 'Golongan II';
    } else if (gol === 'I' || gol.startsWith('I/')) {
      pphGroup = 'Golongan I';
    }
    
    const taxRate = pph21Rates[pphGroup] !== undefined ? pph21Rates[pphGroup] : 0;
    const taxAmount = (bruto * taxRate) / 100;
    const netAmount = bruto - taxAmount;
    
    return {
      ...emp,
      sharePercentage: Number((sharePercentage * 100).toFixed(3)),
      bruto: Math.round(bruto),
      taxRate,
      taxAmount: Math.round(taxAmount),
      spjBersih: Math.round(netAmount)
    };
  });
}
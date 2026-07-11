import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BarChart3, Calendar, ChevronDown, X } from 'lucide-react';
import StatsBar from './StatsBar';
import { MONTHLY_JASPEL } from '../dbService';

function Sidebar({
  isOpen,
  onToggle,
  showStats,
  onToggleStats,
  settings,
  totals,
  onOpenSettings,
  bulanAktif,
  onBulanChange
}) {
  const [isMobile, setIsMobile] = React.useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 1024 : false;
  });

  const bulanList = Object.keys(MONTHLY_JASPEL);
  const activeYear = settings?.tahunAktif || '2026';

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onToggle}
            className="fixed inset-0 bg-neutral-900/45 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
            id="sidebar-backdrop"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? { x: '-100%', width: 288 } : { x: 0, width: isOpen ? 320 : 72 }}
        animate={isMobile ? {
          x: isOpen ? 0 : '-100%',
          width: 288,
        } : {
          x: 0,
          width: isOpen ? 320 : 72,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`bg-white lg:border-r border-neutral-100 flex flex-col shrink-0 overflow-hidden ${
          isMobile 
            ? 'fixed inset-y-0 left-0 z-50 w-72 h-[100dvh] shadow-2xl border-r border-neutral-200' 
            : 'relative min-h-fit'
        }`}
        id="sidebar-container"
      >
        {/* Sidebar Header: Logo & Title "Dana Kapitasi JKN TA 2026" */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-100 gap-2.5 min-h-[64px]" id="sidebar-header">
          {isOpen ? (
            <div className="flex items-center justify-between w-full overflow-hidden">
              <div className="flex items-center gap-2.5 min-w-0">
                <img src="/image/images.png" alt="Logo Puskesmas" className="w-8 h-8 object-contain shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-extrabold text-neutral-800 tracking-tight leading-tight uppercase truncate">
                    Dana Kapitasi JKN
                  </span>
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest leading-none mt-0.5">
                    TA {activeYear}
                  </span>
                </div>
              </div>
              
              {/* Close Button on Mobile */}
              {isMobile && (
                <button
                  onClick={onToggle}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 border border-neutral-150 text-neutral-500 hover:text-neutral-800 transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center shadow-2xs"
                  title="Close Sidebar"
                  id="mobile-sidebar-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="mx-auto flex items-center justify-center animate-fade-in" title={`Dana Kapitasi JKN TA ${activeYear}`} id="sidebar-logo-collapsed">
              <img src="/image/images.png" alt="Logo Puskesmas" className="w-8 h-8 object-contain" />
            </div>
          )}
        </div>


      {/* Navigation Links */}
      <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {/* Month Selector in Sidebar when Open */}
        {isOpen && (
          <div className="px-3 py-2.5 bg-neutral-50 border border-neutral-150/60 rounded-xl space-y-1.5 mb-3" id="sidebar-month-selector">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Periode Aktif</span>
            </div>
            <div className="relative">
              <select
                value={bulanAktif}
                onChange={(e) => {
                  onBulanChange(e.target.value);
                  if (isMobile) onToggle();
                }}
                className="appearance-none w-full pl-3 pr-8 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
              >
                {bulanList.map(bln => {
                  const compoundKeyBln = `${activeYear}_${bln}`;
                  const mKapitasiBln = (settings && settings.monthlyKapitasi && settings.monthlyKapitasi[compoundKeyBln] !== undefined)
                    ? settings.monthlyKapitasi[compoundKeyBln]
                    : (activeYear === '2026' && settings?.monthlyKapitasi?.[bln] !== undefined
                       ? settings.monthlyKapitasi[bln]
                       : (activeYear === '2026' && MONTHLY_JASPEL[bln] ? Math.round(MONTHLY_JASPEL[bln] / 0.75) : 0));
                  const isNoData = mKapitasiBln === 0;
                  return (
                    <option key={bln} value={bln}>
                      {bln} {isNoData ? '(belum ada data)' : ''}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Menu 1: Kelola Pegawai */}
        <button
          onClick={() => {
            if (!isOpen) onToggle();
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-700 bg-neutral-50 border border-neutral-150/50 text-xs font-bold transition-all cursor-pointer"
          id="menu-pegawai-btn"
        >
          <Users className="w-4 h-4 text-emerald-600 shrink-0" />
          {isOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="truncate"
            >
              Kelola Pegawai & Jaspel
            </motion.span>
          )}
        </button>

        {/* Menu 2: Alokasi & Realisasi (Toggles StatsBar Inside Sidebar) */}
        <button
          onClick={onToggleStats}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
            showStats 
              ? 'bg-emerald-50/50 text-emerald-800 border-emerald-100' 
              : 'hover:bg-neutral-50 text-neutral-600 border-transparent hover:border-neutral-100'
          }`}
          title="Tampilkan Alokasi Pagu & Realisasi"
          id="menu-stats-btn"
        >
          <div className="flex items-center gap-3">
            <BarChart3 className={`w-4 h-4 shrink-0 ${showStats ? 'text-emerald-600' : 'text-neutral-500'}`} />
            {isOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="truncate"
              >
                Alokasi & Realisasi
              </motion.span>
            )}
          </div>
          {isOpen && (
            <span className={`w-2 h-2 rounded-full ${showStats ? 'bg-emerald-500' : 'bg-neutral-300'}`} />
          )}
        </button>

        {/* StatsBar content nested within the Sidebar */}
        <AnimatePresence initial={false}>
          {isOpen && showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-neutral-100 pt-4"
              id="sidebar-stats-bar-wrapper"
            >
              <StatsBar
                settings={settings}
                totals={totals}
                onOpenSettings={onOpenSettings}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini View for Collapsed Sidebar */}
      {!isOpen && (
        <div className="p-3 border-t border-neutral-100 flex flex-col items-center gap-2 pb-4">
          <button
            onClick={onToggle}
            className="w-10 h-10 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-500 font-extrabold text-[9px] uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 hover:bg-neutral-100 transition-all cursor-pointer shadow-xs"
            title={`Bulan Aktif: ${bulanAktif}. Klik untuk membuka sidebar & mengubah.`}
            id="collapsed-month-btn"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="leading-none">{bulanAktif?.substring(0, 3)}</span>
          </button>

          <button
            onClick={onToggleStats}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              showStats 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                : 'bg-neutral-50 border-neutral-200 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
            }`}
            title="Tampilkan Statistik di Sidebar"
            id="mini-stats-toggle"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.aside>
    </>
  );
}

export default Sidebar;

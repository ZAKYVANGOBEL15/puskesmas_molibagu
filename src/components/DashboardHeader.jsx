import React from 'react';
import { Wifi, WifiOff, Settings, LogOut } from 'lucide-react';

function DashboardHeader({ 
  isFirebaseConnected, 
  onOpenSettings, 
  onLogout, 
  _settings,
  sidebarOpen,
  onToggleSidebar
}) {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-white" id="dashboard-navbar">
      {/* Left Block: Hamburger Toggle Button */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar}
          className="p-2 rounded-xl hover:bg-neutral-50 border border-neutral-200 text-neutral-500 hover:text-neutral-800 transition-all cursor-pointer shrink-0 shadow-xs active:scale-95 flex items-center justify-center w-9 h-9"
          title="Toggle Sidebar Menu"
          id="navbar-hamburger-btn"
        >
          <div className="w-5 h-5 relative flex flex-col justify-center items-center">
            <span className={`block absolute h-0.5 w-5 bg-neutral-600 rounded-full transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'rotate-45' : '-translate-y-1.5'
            }`} />
            <span className={`block absolute h-0.5 w-5 bg-neutral-600 rounded-full transition-all duration-300 ease-in-out ${
              sidebarOpen ? 'opacity-0' : 'opacity-100'
            }`} />
            <span className={`block absolute h-0.5 w-5 bg-neutral-600 rounded-full transition-all duration-300 ease-in-out ${
              sidebarOpen ? '-rotate-45' : 'translate-y-1.5'
            }`} />
          </div>
        </button>
      </div>

      {/* Right Block: Actions */}
      <div className="flex items-center gap-2">
        {/* Cloud Badge (Read-Only Status Indicator) */}
        <div
          className={`flex items-center justify-center p-1.5 rounded-full border transition-all ${
            isFirebaseConnected
              ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700'
              : 'bg-amber-50/50 border-amber-100/50 text-amber-700'
          }`}
          title={isFirebaseConnected ? 'Sinkron Cloud' : 'Mode Lokal'}
          id="cloud-status-badge"
        >
          {isFirebaseConnected ? (
            <Wifi className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
          )}
        </div>

        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer shadow-xs active:scale-95"
          id="navbar-settings-btn"
        >
          <Settings className="w-3.5 h-3.5 text-neutral-500" />
          <span className="hidden sm:inline">Pengaturan</span>
        </button>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
          id="navbar-logout-btn"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kunci Layar</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;

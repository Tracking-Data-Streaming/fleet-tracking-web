import { Bell, LogOut, Menu, Search, Moon } from 'lucide-react';

export default function Header({ onMenuToggle, onLogout, title = "VSmart Tracking" }) {
  return (
    <header className="sticky top-0 z-40 h-16 shrink-0 border-b border-slate-200/80 bg-white text-slate-800 shadow-sm">
      <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6">
        
        {/* Left section: Menu Toggle & Search Bar */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4 max-w-xl">
          <button
            onClick={onMenuToggle}
            className="lg:hidden rounded-xl p-2 transition-colors hover:bg-slate-50 text-slate-600"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search bar matching mock UI */}
          <div className="relative w-full max-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              readOnly
              placeholder="Search..."
              className="w-full bg-slate-50 border border-slate-200/80 text-slate-800 text-xs rounded-xl py-2.5 pl-10 pr-10 focus:outline-none placeholder:text-slate-400"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-0.5 pointer-events-none">
              <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1 rounded">⌘</span>
              <span className="text-[10px] font-medium text-slate-400 bg-white border border-slate-200 px-1 rounded">F</span>
            </div>
          </div>
        </div>

        {/* Right section: Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          
          {/* Language Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200/60 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <span className="text-sm leading-none">🇬🇧</span>
            <span>English</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Notification Button */}
          <button className="relative rounded-xl p-2.5 transition-colors hover:bg-slate-50 border border-slate-100 text-slate-600 bg-slate-50/50">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full"></span>
          </button>

          {/* Theme Toggle (Moon Icon) */}
          <button className="rounded-xl p-2.5 transition-colors hover:bg-slate-50 border border-slate-100 text-slate-600 bg-slate-50/50">
            <Moon className="w-4 h-4" />
          </button>

          <div className="mx-1 h-6 w-px bg-slate-200"></div>

          {/* Logout Button */}
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-slate-700 transition-colors text-xs font-semibold shadow-sm"
            onClick={onLogout}
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:block">Sign out</span>
          </button>

        </div>
      </div>
    </header>
  );
}

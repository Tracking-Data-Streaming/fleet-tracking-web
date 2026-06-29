import { Bell, LogOut, Menu, Settings } from 'lucide-react';
import siteLogo from '../../assets/icon.png';

export default function Header({ onMenuToggle, onLogout, title = "IoT Asset Tracking" }) {
  return (
    <header className="sticky top-0 z-50 h-16 shrink-0 border-b border-gray-200 bg-white text-gray-900 shadow-card">
      <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left section */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            onClick={onMenuToggle}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <img src={siteLogo} alt="VSmart Logo" className="h-10 w-10 shrink-0 object-contain drop-shadow-lg" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">
                {title === "IoT Asset Tracking System" ? "VSmart Tracking" : title}
              </h1>
              <p className="text-xs text-gray-600 font-medium">Monitoring Dashboard</p>
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button className="relative rounded-lg p-2 transition-colors hover:bg-gray-100">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button className="hidden rounded-lg p-2 transition-colors hover:bg-gray-100 sm:inline-flex">
            <Settings className="w-5 h-5" />
          </button>

          <div className="mx-1 hidden h-6 w-px bg-gray-300 sm:block"></div>

          <button
            type="button"
            className="group relative flex items-center gap-2 rounded-lg border border-transparent px-2 py-2 text-gray-700 transition-colors hover:border-gray-200 hover:bg-gray-100"
            onClick={onLogout}
            title="Đăng xuất"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-aws-orange text-white">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-medium md:block">
              Đăng xuất
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

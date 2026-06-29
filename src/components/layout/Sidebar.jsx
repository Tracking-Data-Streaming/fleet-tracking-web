import { Map, Navigation, Shield, Settings, X } from 'lucide-react';
import { clsx } from 'clsx';

const menuItems = [
  { icon: Map, label: 'Map View', id: 'map' },
  { icon: Navigation, label: 'Devices', id: 'devices' },
  { icon: Shield, label: 'Geofences', id: 'geofences' },
  { icon: Settings, label: 'Settings', id: 'settings' },
];

export default function Sidebar({ isOpen, onClose, activeView, onViewChange }) {
  const isCollapsedDesktop = !isOpen;

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed bottom-0 left-0 top-16 z-40 shrink-0 overflow-hidden border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-in-out lg:relative lg:top-0 lg:z-0 lg:flex lg:shadow-none',
          isOpen
            ? 'w-64 max-w-[85vw] translate-x-0 lg:max-w-none'
            : 'w-64 max-w-[85vw] -translate-x-full lg:w-20 lg:max-w-none lg:translate-x-0'
        )}
      >
        <div className="flex h-full w-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={clsx(
                    'flex w-full items-center rounded-lg border-l-4 px-4 py-3 transition-colors',
                    isCollapsedDesktop ? 'justify-center lg:px-0' : 'gap-3',
                    isActive
                      ? 'border-aws-orange bg-orange-50 text-aws-orange'
                      : 'border-transparent text-gray-700 hover:bg-gray-100 hover:text-aws-orange'
                  )}
                  title={isCollapsedDesktop ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={clsx('font-medium', isCollapsedDesktop && 'lg:hidden')}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className={clsx('border-t border-gray-200 p-4', isCollapsedDesktop && 'lg:px-3')}>
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className={clsx('mb-2 flex items-center', isCollapsedDesktop ? 'justify-center' : 'space-x-2')}>
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className={clsx('text-sm font-medium text-gray-900', isCollapsedDesktop && 'lg:hidden')}>
                  System Status
                </span>
              </div>
              <p className={clsx('text-xs text-gray-600', isCollapsedDesktop && 'lg:hidden')}>
                All services operational
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

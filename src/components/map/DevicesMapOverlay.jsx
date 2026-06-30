import { Navigation2, X, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { Truck, Car, Package, Bus, Bike } from 'lucide-react';

const TYPE_CONFIG = {
    truck: { label: 'Truck', Icon: Truck, color: 'text-indigo-600 bg-indigo-50' },
    car: { label: 'Car', Icon: Car, color: 'text-blue-600 bg-blue-50' },
    motorbike: { label: 'Motorbike', Icon: Bike, color: 'text-purple-600 bg-purple-50' },
    van: { label: 'Van', Icon: Package, color: 'text-teal-600 bg-teal-50' },
    bus: { label: 'Bus', Icon: Bus, color: 'text-green-600 bg-green-50' },
    other: { label: 'Other', Icon: Package, color: 'text-slate-650 bg-slate-50' },
};

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'text-green-700 bg-green-50 border-green-200' },
    inactive: { label: 'Inactive', color: 'text-slate-650 bg-slate-50 border-slate-200' },
    maintenance: { label: 'Maintenance', color: 'text-yellow-705 bg-yellow-50 border-yellow-200' },
};

export default function DevicesMapOverlay({
    devices,
    isOpenedPanel,
    onPanelChange,
    onDeviceSelect,
}) {
    return (
        <>
            {/* Devices toggle button */}
            <div className="absolute top-4 left-[155px] z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        isOpenedPanel ? onPanelChange(null) : onPanelChange('devices');
                    }}
                    className="btn-primary flex items-center space-x-2 shadow-sm"
                >
                    <Navigation2 className="w-5 h-5" />
                    <span>Devices</span>
                </button>
            </div>

            {/* Devices Dropdown Panel */}
            {isOpenedPanel && (
                <div className="absolute top-16 left-[155px] w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_35px_rgba(15,23,42,0.1)] border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[60vh] select-none animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
                        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                            <Navigation2 className="w-4 h-4 text-indigo-650" />
                            <span>Registered Devices ({devices.length})</span>
                        </h2>
                        <button
                            onClick={() => onPanelChange(null)}
                            className="text-slate-400 hover:text-slate-650 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {devices.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                                No devices found.
                            </div>
                        ) : (
                            devices.map((device) => {
                                const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG.other;
                                const statusConf = STATUS_CONFIG[device.status] || STATUS_CONFIG.active;
                                const TypeIcon = typeConf.Icon;

                                return (
                                    <div
                                        key={device.deviceId}
                                        onClick={() => {
                                            onDeviceSelect(device, true); // true = zoom to device
                                            onPanelChange(null); // close panel after selection
                                        }}
                                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-100 transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={clsx('p-2 rounded-xl', typeConf.color)}>
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 text-xs leading-tight">
                                                    {device.displayName || device.deviceId}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span
                                                        className={clsx(
                                                            'inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border',
                                                            statusConf.color
                                                        )}
                                                    >
                                                        {statusConf.label}
                                                    </span>
                                                    {!device.position && (
                                                        <span className="text-[10px] text-slate-400 italic font-medium">
                                                            Unknown location
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Hover Locate Icon */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="p-1.5 text-slate-400 group-hover:text-indigo-650 bg-indigo-50/50 rounded-xl">
                                                <Crosshair className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

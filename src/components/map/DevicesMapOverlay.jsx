import { Navigation2, X, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { Truck, Car, Package, Bus, Bike } from 'lucide-react';

const TYPE_CONFIG = {
    truck: { label: 'Truck', Icon: Truck, color: 'text-orange-600 bg-orange-50' },
    car: { label: 'Car', Icon: Car, color: 'text-blue-600 bg-blue-50' },
    motorbike: { label: 'Motorbike', Icon: Bike, color: 'text-purple-600 bg-purple-50' },
    van: { label: 'Van', Icon: Package, color: 'text-teal-600 bg-teal-50' },
    bus: { label: 'Bus', Icon: Bus, color: 'text-green-600 bg-green-50' },
    other: { label: 'Other', Icon: Package, color: 'text-gray-600 bg-gray-50' },
};

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'text-green-700 bg-green-50 border-green-200' },
    inactive: { label: 'Inactive', color: 'text-gray-600 bg-gray-50 border-gray-200' },
    maintenance: { label: 'Maintenance', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
};

export default function DevicesMapOverlay({
    devices,
    isOpenedPanel,
    onPanelChange,
    onDeviceSelect,
}) {
    return (
        <>
            {/* Devices toggle button (next to Geofences button) */}
            <div className="absolute top-4 left-[155px] z-10">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        isOpenedPanel ? onPanelChange(null) : onPanelChange('devices');
                    }}
                    className="btn-primary flex items-center space-x-2 shadow-aws-lg"
                >
                    <Navigation2 className="w-5 h-5" />
                    <span>Devices</span>
                </button>
            </div>

            {/* Devices Dropdown Panel */}
            {isOpenedPanel && (
                <div className="absolute top-16 left-4 w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 z-10 overflow-hidden flex flex-col max-h-[60vh]">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-aws-gray-200 bg-aws-gray-50">
                        <h2 className="text-base font-semibold text-aws-gray-900 flex items-center space-x-2">
                            <Navigation2 className="w-4 h-4 text-aws-orange" />
                            <span>Registered Devices ({devices.length})</span>
                        </h2>
                        <button
                            onClick={() => onPanelChange(null)}
                            className="text-aws-gray-400 hover:text-aws-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto p-2 space-y-1">
                        {devices.length === 0 ? (
                            <div className="text-center py-6 text-aws-gray-500 text-sm">
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
                                            onPanelChange(null); // Optional: close panel after selection
                                        }}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-aws-gray-50 cursor-pointer border border-transparent hover:border-aws-gray-200 transition-all group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={clsx('p-2 rounded-lg', typeConf.color)}>
                                                <TypeIcon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-aws-gray-900 text-sm leading-tight">
                                                    {device.displayName || device.deviceId}
                                                </p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span
                                                        className={clsx(
                                                            'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border',
                                                            statusConf.color
                                                        )}
                                                    >
                                                        {statusConf.label}
                                                    </span>
                                                    {!device.position && (
                                                        <span className="text-[10px] text-aws-gray-400 italic">
                                                            Unknown location
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Hover Locate Icon */}
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="p-1.5 text-aws-gray-400 group-hover:text-aws-orange bg-orange-50 rounded-lg">
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

import { Shield, ShieldAlert, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function ConfirmAntiTheftModal({ device, isOpen, onConfirm, onCancel, isEnabling }) {
    if (!isOpen || !device) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-aws-lg max-w-sm w-full mx-4">

                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-aws-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className={clsx(
                            "p-2 rounded-lg",
                            isEnabling ? "bg-green-50" : "bg-red-50"
                        )}>
                            {isEnabling
                                ? <Shield className="w-5 h-5 text-green-600" />
                                : <ShieldAlert className="w-5 h-5 text-red-600" />
                            }
                        </div>
                        <h2 className="text-lg font-semibold text-aws-gray-900">
                            {isEnabling ? "Enable Anti-theft" : "Disable Anti-theft"}
                        </h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-aws-gray-400 hover:text-aws-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <p className="text-aws-gray-700 text-sm mb-3">
                        {isEnabling
                            ? "This will create an automated 10-meter geofence shield around the device's current location. If the device moves outside this shield, you will receive an instant email alert."
                            : "This will remove the automated geofence shield and stop alerting you about this device's movements."
                        }
                    </p>
                    <div className="bg-aws-gray-50 rounded-lg p-3">
                        <p className="text-xs text-aws-gray-500 uppercase tracking-wider font-semibold mb-1">Target Device</p>
                        <p className="text-sm font-semibold text-aws-gray-900">{device.displayName || device.deviceId}</p>
                        <p className="text-xs text-aws-gray-500 font-mono mt-0.5">{device.deviceId}</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end p-4 border-t border-aws-gray-200 space-x-3 bg-aws-gray-50 rounded-b-lg">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-aws-gray-700 hover:bg-aws-gray-200 rounded-lg transition-colors border border-aws-gray-300 bg-white"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className={clsx(
                            "px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm",
                            isEnabling
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                        )}
                    >
                        {isEnabling ? "Turn On Shield" : "Turn Off Shield"}
                    </button>
                </div>
            </div>
        </div>
    );
}

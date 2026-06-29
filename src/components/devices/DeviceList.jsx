import { useState, useEffect, useRef } from 'react';
import {
  Navigation2, MapPin, Clock, Activity, Trash2, Pencil, Plus,
  Wifi, WifiOff, Truck, Car, Package, Bus, Bike, AlertTriangle,
  RefreshCw, Search, Shield, ShieldAlert, Crosshair,
} from 'lucide-react';
import { clsx } from 'clsx';
import { antitheftApi } from '../../api/deviceApi';
import DeleteDeviceModal from './DeleteDeviceModal';
import DeviceFormModal from './DeviceFormModal';
import ConfirmAntiTheftModal from './ConfirmAntiTheftModal';

// ─── CONSTANTS ─────────────────────────────────────────────────────────────

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

// ─── HELPERS ───────────────────────────────────────────────────────────────

const getOnlineStatus = (device) => {
  if (!device.sampleTime) return { color: 'gray', text: 'No data yet' };
  const diffMin = (new Date() - new Date(device.sampleTime)) / 60000;
  if (diffMin < 5) return { color: 'green', text: 'Online' };
  if (diffMin < 30) return { color: 'yellow', text: `${Math.floor(diffMin)}m ago` };
  const diffH = Math.floor(diffMin / 60);
  return { color: 'red', text: diffH < 24 ? `${diffH}h ago` : 'Offline' };
};

// ─── UNREGISTERED BANNER ──────────────────────────────────────────────────

function UnregisteredBanner({ devices, onQuickRegister }) {
  if (!devices || devices.length === 0) return null;
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-yellow-800">
            {devices.length} device{devices.length > 1 ? 's are' : ' is'} sending data but not yet registered
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {devices.map((d) => (
              <button
                key={d.deviceId}
                onClick={() => onQuickRegister(d.deviceId)}
                className="inline-flex items-center px-2 py-1 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-mono transition-colors border border-yellow-300"
                title="Click to register"
              >
                <Plus className="w-3 h-3 mr-1" />
                {d.deviceId}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADDRESS RESOLVER ─────────────────────────────────────────────────────

function AddressResolver({ position }) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const lastFetchedPos = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchAddress = async () => {
      try {
        setLoading(true);
        // OpenStreetMap Nominatim Free API
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position[1]}&lon=${position[0]}&zoom=18&addressdetails=1`);
        const data = await res.json();

        let finalAddress = data.display_name || "Unknown location";

        if (isMounted) {
          setAddress(finalAddress);
          lastFetchedPos.current = `${position[1]},${position[0]}`;
        }
      } catch (err) {
        if (isMounted) setAddress("Cannot translate location");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // If no address yet or device drastically moved
    let shouldFetch = false;
    if (!address || !lastFetchedPos.current) {
      shouldFetch = true;
    } else {
      const [oldLat, oldLng] = lastFetchedPos.current.split(',').map(Number);
      if (Math.abs(oldLat - position[1]) > 0.001 || Math.abs(oldLng - position[0]) > 0.001) {
        shouldFetch = true;
      }
    }

    if (shouldFetch) {
      fetchAddress();
    }

    return () => { isMounted = false; };
  }, [position[1], position[0]]);

  return (
    <div className="flex items-start space-x-1.5 text-xs text-aws-gray-700">
      <MapPin className="w-3.5 h-3.5 text-aws-orange mt-0.5 flex-shrink-0" />
      <span className="font-medium leading-tight" title={address || "Translating..."}>
        {loading ? <span className="text-aws-gray-400 italic">Translating position...</span> : address}
      </span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────

export default function DeviceList({
  devices = [],
  unregisteredDevices = [],
  selectedDevice,
  onDeviceSelect,
  onDeviceCreate,
  onDeviceUpdate,
  onDeviceDelete,
  loading,
  onRefresh,
}) {
  const [deleteModal, setDeleteModal] = useState({ open: false, deviceId: null });
  const [formModal, setFormModal] = useState({ open: false, device: null });
  const [antitheftModal, setAntitheftModal] = useState({ open: false, device: null, isEnabling: false });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // ── Filter & Search ──
  const filtered = devices.filter((d) => {
    const matchSearch =
      !search ||
      d.deviceId?.toLowerCase().includes(search.toLowerCase()) ||
      d.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const onlineCount = devices.filter((d) => {
    if (!d.sampleTime) return false;
    return (new Date() - new Date(d.sampleTime)) / 60000 < 5;
  }).length;

  // ── Handlers ──
  const openCreate = (prefillId = '') => {
    setFormModal({
      open: true,
      device: prefillId ? { deviceId: prefillId, _quickRegister: true } : null,
    });
  };

  const handleFormSubmit = async (formData) => {
    if (formModal.device && !formModal.device._quickRegister) {
      await onDeviceUpdate(formModal.device.deviceId, formData);
    } else {
      await onDeviceCreate(formData);
    }
  };

  const handleDelete = async () => {
    if (onDeviceDelete && deleteModal.deviceId) {
      await onDeviceDelete(deleteModal.deviceId);
      setDeleteModal({ open: false, deviceId: null });
    }
  };

  const initiateAntitheftToggle = (device) => {
    setAntitheftModal({
      open: true,
      device: device,
      isEnabling: !device.antitheftEnabled
    });
  };

  const confirmAntitheftToggle = async () => {
    const { device, isEnabling } = antitheftModal;
    setAntitheftModal({ open: false, device: null, isEnabling: false });

    if (!device) return;

    try {
      if (!isEnabling) {
        await antitheftApi.disable(device.deviceId);
      } else {
        await antitheftApi.enable(device.deviceId);
        if (onDeviceSelect) {
          onDeviceSelect(device, true); // true = zoom to device
        }
      }
      // Refresh to get updated antitheftEnabled state
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Anti-theft error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Header toolbar ── */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-aws-gray-900 flex items-center space-x-2">
            <Navigation2 className="w-5 h-5 text-aws-orange" />
            <span>Device Management</span>
          </h2>
          <p className="text-sm text-aws-gray-500 mt-0.5 sm:ml-7">
            {devices.length} registered · <span className={onlineCount > 0 ? "text-green-600" : ""}>{onlineCount} online</span>
          </p>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-aws-gray-500 hover:text-aws-gray-700 hover:bg-aws-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => openCreate()}
            className="flex items-center space-x-2 px-4 py-2 bg-aws-orange text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Device</span>
          </button>
        </div>
      </div>

      {/* ── Unregistered banner ── */}
      <UnregisteredBanner
        devices={unregisteredDevices}
        onQuickRegister={(id) => openCreate(id)}
      />

      {/* ── Search + Filter bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-aws-gray-400" />
          <input
            type="text"
            placeholder="Search by ID or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-aws-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aws-orange transition"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-aws-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aws-orange transition"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* ── Device Table ── */}
      {loading && devices.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-aws-gray-400">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading devices...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-aws-gray-400 bg-white rounded-lg border border-aws-gray-200">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-40" />
          {devices.length === 0 ? (
            <>
              <p className="font-medium">No devices registered yet</p>
              <p className="text-sm mt-1">Click "Add Device" to register your first device</p>
            </>
          ) : (
            <p className="font-medium">No devices match your search</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-aws-gray-200 rounded-xl shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-aws-gray-50 text-aws-gray-600 text-xs uppercase tracking-wider font-semibold border-b border-aws-gray-200">
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">Status & Network</th>
                <th className="py-3 px-4">Last Position</th>
                <th className="py-3 px-4">Anti-Theft Shield</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aws-gray-100">
              {filtered.map((device) => {
                const online = getOnlineStatus(device);
                const typeConf = TYPE_CONFIG[device.type] || TYPE_CONFIG.other;
                const statusConf = STATUS_CONFIG[device.status] || STATUS_CONFIG.active;
                const TypeIcon = typeConf.Icon;
                const antitheftOn = !!device.antitheftEnabled;
                const isSelected = selectedDevice && selectedDevice.deviceId === device.deviceId;

                return (
                  <tr
                    key={device.deviceId}
                    className={clsx(
                      "group hover:bg-aws-gray-50 transition-colors border-l-2",
                      isSelected ? "border-aws-orange bg-aws-gray-50/50" : "border-transparent"
                    )}
                  >

                    {/* Column: Device Name/ID */}
                    <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => onDeviceSelect(device)}>
                      <div className="flex items-center space-x-3">
                        <div className={clsx('p-2 rounded-lg', typeConf.color)}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-aws-gray-900 text-sm leading-tight">
                            {device.displayName || device.deviceId}
                          </p>
                          <p className="text-xs text-aws-gray-500 font-mono mt-0.5">{device.deviceId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Column: Status & Connectivity */}
                    <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => onDeviceSelect(device)}>
                      <div className="flex flex-col space-y-1.5 items-start">
                        <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide border font-bold', statusConf.color)}>
                          {statusConf.label}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {online.color === 'green'
                            ? <Wifi className="w-3.5 h-3.5 text-green-500" />
                            : <WifiOff className="w-3.5 h-3.5 text-aws-gray-400" />}
                          <span className={clsx(
                            "text-xs font-medium",
                            online.color === 'green' && 'text-green-600',
                            online.color === 'yellow' && 'text-yellow-600',
                            online.color === 'red' && 'text-red-500',
                            online.color === 'gray' && 'text-aws-gray-500',
                          )}>
                            {online.text}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column: Location */}
                    <td className="py-3 px-4 min-w-[200px] max-w-[250px] cursor-pointer" onClick={() => onDeviceSelect(device)}>
                      {device.position ? (
                        <div className="flex flex-col">
                          <AddressResolver position={device.position} />
                          {device.sampleTime && (
                            <div className="text-[10px] text-aws-gray-400 mt-1 ml-5">
                              Last seen: {new Date(device.sampleTime).toLocaleTimeString('en-US', { hour12: false })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 text-aws-gray-400 text-xs italic">
                          <MapPin className="w-3 h-3" />
                          <span>No position data</span>
                        </div>
                      )}
                    </td>

                    {/* Column: Protection */}
                    <td className="py-3 px-4 whitespace-nowrap cursor-pointer" onClick={() => onDeviceSelect(device)}>
                      {antitheftOn ? (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs border border-red-300 bg-red-50 text-red-700 font-medium">
                          <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                          <span>Shield Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs bg-aws-gray-100 text-aws-gray-500">
                          <Shield className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>

                    {/* Column: Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); initiateAntitheftToggle(device); }}
                          className={clsx(
                            'p-2 rounded-lg transition-all',
                            antitheftOn
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                              : 'text-aws-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          )}
                          title={antitheftOn ? 'Disable Shield' : 'Enable Shield'}
                        >
                          {antitheftOn ? <ShieldAlert className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); setFormModal({ open: true, device }); }}
                          className="p-2 text-aws-gray-400 hover:text-aws-gray-800 hover:bg-aws-gray-200 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteModal({ open: true, deviceId: device.deviceId }); }}
                          className="p-2 text-aws-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modals ── */}
      <DeviceFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, device: null })}
        onSubmit={handleFormSubmit}
        device={
          formModal.device?._quickRegister
            ? { ...formModal.device, displayName: formModal.device.deviceId }
            : formModal.device
        }
      />

      <DeleteDeviceModal
        deviceId={deleteModal.deviceId}
        isOpen={deleteModal.open}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, deviceId: null })}
      />
      <ConfirmAntiTheftModal
        device={antitheftModal.device}
        isOpen={antitheftModal.open}
        isEnabling={antitheftModal.isEnabling}
        onConfirm={confirmAntitheftToggle}
        onCancel={() => setAntitheftModal({ open: false, device: null, isEnabling: false })}
      />
    </div>
  );
}

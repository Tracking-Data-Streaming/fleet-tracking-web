import { useState, useEffect, useMemo } from 'react';
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre';
import { 
  Truck, 
  XCircle, 
  RefreshCw, 
  CheckCircle, 
  ArrowRight, 
  Filter, 
  Download, 
  Plus, 
  MapPin, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { deviceApi } from '../../api/deviceApi';
import { REGION, MAP, API_KEY } from '../../configuration';
// Calculate distance between two coordinates in km (Haversine formula)
const getDistanceKm = (coords1, coords2) => {
  if (!coords1 || !coords2) return 0;
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

// Presets for routes if not in DB
const PRESET_ROUTES = {
  'Vehicle-001': 'Thu Duc -> District 1',
  'Vehicle-002': 'Binh Thanh -> District 3',
  'Vehicle-003': 'District 7 -> Nha Be',
  'default': 'District 1 -> Tan Binh'
};

export default function DashboardView({ 
  devices = [], 
  onViewChange, 
  onDeviceSelect,
  onAddDevice
}) {
  const [selectedDashboardDevice, setSelectedDashboardDevice] = useState(null);
  const [historyPoints, setHistoryPoints] = useState([]);
  const [mapViewport, setMapViewport] = useState({
    longitude: 106.7864,
    latitude: 10.8481,
    zoom: 12
  });

  // Calculate statistics from real devices
  const stats = useMemo(() => {
    const total = devices.length;
    const inactive = devices.filter(d => d.status === 'inactive').length;
    const maintenance = devices.filter(d => d.status === 'maintenance').length;
    const active = devices.filter(d => d.status === 'active').length;
    return { total, inactive, maintenance, active };
  }, [devices]);

  // Set first device as default selected for the dashboard mini-map
  useEffect(() => {
    if (devices.length > 0 && !selectedDashboardDevice) {
      // Find first device with position
      const devWithPos = devices.find(d => d.position || d.Position);
      setSelectedDashboardDevice(devWithPos || devices[0]);
    }
  }, [devices, selectedDashboardDevice]);

  // Fetch history for selected dashboard device to draw a route on the mini-map
  useEffect(() => {
    const devId = selectedDashboardDevice?.deviceId || selectedDashboardDevice?.DeviceId;
    if (!devId) return;

    deviceApi.getHistory(devId)
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          const sorted = [...res.data].sort(
            (a, b) => new Date(a.SampleTime || a.sampleTime) - new Date(b.SampleTime || b.sampleTime)
          );
          setHistoryPoints(sorted);

          // Center map on last point
          if (sorted.length > 0) {
            const lastPt = sorted[sorted.length - 1];
            const pos = lastPt.Position || lastPt.position;
            if (pos && pos.length >= 2) {
              setMapViewport(prev => ({
                ...prev,
                longitude: pos[0],
                latitude: pos[1]
              }));
            }
          }
        }
      })
      .catch(err => {
        console.error('Failed to fetch dashboard map history:', err);
        setHistoryPoints([]);
      });
  }, [selectedDashboardDevice]);

  // Calculations for average speed, distance, duration of the route
  const routeStats = useMemo(() => {
    if (historyPoints.length < 2) {
      return { avgSpeed: null, totalDistance: null, durationStr: null };
    }

    let totalDist = 0;
    let totalSpeed = 0;
    let validSpeedCount = 0;

    for (let i = 0; i < historyPoints.length - 1; i++) {
      const p1 = historyPoints[i];
      const p2 = historyPoints[i + 1];
      const pos1 = p1.Position || p1.position;
      const pos2 = p2.Position || p2.position;

      if (pos1 && pos2) {
        totalDist += getDistanceKm(pos1, pos2);
      }

      const speed = Number(p1.PositionProperties?.speed || p1.positionProperties?.speed);
      if (!isNaN(speed) && speed > 0) {
        totalSpeed += speed;
        validSpeedCount++;
      }
    }

    const t1 = new Date(historyPoints[0].SampleTime || historyPoints[0].sampleTime);
    const t2 = new Date(historyPoints[historyPoints.length - 1].SampleTime || historyPoints[historyPoints.length - 1].sampleTime);
    const diffMs = Math.abs(t2 - t1);
    const diffHrs = diffMs / 1000 / 60 / 60;

    const avgSpeed = validSpeedCount > 0 ? (totalSpeed / validSpeedCount) : (totalDist / (diffHrs || 1));
    
    // Format duration string
    const diffMins = Math.round(diffMs / 1000 / 60);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    const durationStr = h > 0 ? `${h}h ${m}m` : `${m} mins`;

    return {
      avgSpeed: avgSpeed > 0 ? `${Math.round(avgSpeed)} km/h` : '0 km/h',
      totalDistance: totalDist > 0 ? `${totalDist.toFixed(2)} km` : '0 km',
      durationStr: durationStr
    };
  }, [historyPoints]);

  // GeoJSON Line for the path history
  const geojsonLine = useMemo(() => {
    if (historyPoints.length < 2) return null;
    const coords = historyPoints
      .map(pt => pt.Position || pt.position)
      .filter(pos => pos && pos.length >= 2);

    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords
      }
    };
  }, [historyPoints]);

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50 custom-scrollbar select-none">
      
      {/* ── Title Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">
            Here's a detailed overview of your dashboard fleet tracking.
          </p>
        </div>
      </div>

      {/* ── Top Grid Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Vehicles</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-650">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <button 
            onClick={() => onViewChange('devices')}
            className="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-850 transition-colors mt-auto"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Inactive */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Not Available</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-500">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <button 
            onClick={() => onViewChange('devices')}
            className="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-850 transition-colors mt-auto"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: Maintenance */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">In Repair</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.maintenance}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-green-50 flex items-center justify-center text-green-550">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <button 
            onClick={() => onViewChange('devices')}
            className="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-850 transition-colors mt-auto"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: Active */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col justify-between h-36">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reserved</p>
              <p className="text-3xl font-extrabold text-slate-800 mt-2">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <button 
            onClick={() => onViewChange('devices')}
            className="flex items-center space-x-1.5 text-xs text-indigo-600 font-bold hover:text-indigo-850 transition-colors mt-auto"
          >
            <span>View Details</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Middle Section: Map + Ongoing Delivery ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Map Overview (7/12 width) */}
        <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Map Overview</h2>
              {selectedDashboardDevice && (
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Showing active route for: <span className="text-indigo-600 font-bold">{selectedDashboardDevice.displayName || selectedDashboardDevice.deviceId}</span>
                </p>
              )}
            </div>
            
            {/* Device selector */}
            <select
              value={selectedDashboardDevice?.deviceId || ''}
              onChange={(e) => {
                const dev = devices.find(d => d.deviceId === e.target.value);
                if (dev) setSelectedDashboardDevice(dev);
              }}
              className="text-xs font-bold border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-600 cursor-pointer"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.displayName || d.deviceId}
                </option>
              ))}
            </select>
          </div>

          {/* Interactive Map */}
          <div className="flex-1 rounded-2xl overflow-hidden relative border border-slate-100">
            <Map
              longitude={mapViewport.longitude}
              latitude={mapViewport.latitude}
              zoom={mapViewport.zoom}
              onMove={evt => setMapViewport(evt.viewState)}
              style={{ width: '100%', height: '100%' }}
              mapStyle={`https://maps.geo.${REGION}.amazonaws.com/v2/styles/${MAP.STYLE}/descriptor?key=${API_KEY}&color-scheme=${MAP.COLOR_SCHEME}`}
              validateStyle={false}
            >
              {/* Route line */}
              {geojsonLine && (
                <Source id="route-path" type="geojson" data={geojsonLine}>
                  <Layer
                    id="route-line-layer"
                    type="line"
                    paint={{
                      'line-color': '#4F46E5',
                      'line-width': 4,
                      'line-opacity': 0.85
                    }}
                    layout={{
                      'line-cap': 'round',
                      'line-join': 'round'
                    }}
                  />
                </Source>
              )}

              {/* End Marker (last point) */}
              {historyPoints.length > 0 && (
                <Marker
                  longitude={(historyPoints[historyPoints.length - 1].Position || historyPoints[historyPoints.length - 1].position)[0]}
                  latitude={(historyPoints[historyPoints.length - 1].Position || historyPoints[historyPoints.length - 1].position)[1]}
                  anchor="center"
                >
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 w-8 h-8 bg-indigo-600 opacity-25 rounded-full animate-ping" />
                    <div className="w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-md flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                  </div>
                </Marker>
              )}
            </Map>

            {/* Bottom floating details overlay inside map */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl p-4 shadow-lg grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Average Speed</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {routeStats.avgSpeed || '---'}
                </p>
              </div>
              <div className="border-x border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distance</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {routeStats.totalDistance || '---'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Duration</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  {routeStats.durationStr || '---'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Ongoing Delivery (5/12 width) */}
        <div className="lg:col-span-5 bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] flex flex-col h-[480px]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ongoing Delivery</h2>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Active transit events</p>
            </div>
            <button className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* List of ongoing deliveries */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {devices.filter(d => d.status === 'active').length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs italic font-medium py-12">
                <Truck className="w-8 h-8 mb-2 opacity-30 text-indigo-600" />
                <span>No vehicles currently active.</span>
              </div>
            ) : (
              devices.filter(d => d.status === 'active').map((device) => {
                const routeName = PRESET_ROUTES[device.deviceId] || PRESET_ROUTES.default;
                return (
                  <div 
                    key={device.deviceId}
                    onClick={() => onDeviceSelect(device, true)}
                    className="border border-slate-100 hover:border-indigo-200/80 rounded-2xl p-4 transition-all cursor-pointer bg-slate-50/20 hover:bg-indigo-50/5/10 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-1 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-700 text-xs leading-tight">
                          {device.displayName || 'Unassigned Driver'}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{device.deviceId}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-green-50 border border-green-200 text-green-700">
                        In Delivery
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-left">
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vehicle Name</p>
                        <p className="text-xs font-bold text-slate-655 mt-0.5 truncate">
                          {device.displayName || device.deviceId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vehicle Code</p>
                        <p className="text-xs font-mono font-bold text-slate-655 mt-0.5 truncate">
                          {device.deviceId}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 bg-indigo-50/30 rounded-xl p-2 flex items-center justify-between text-[10px] font-bold text-indigo-650">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Route:</span>
                      </div>
                      <span>{routeName}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Recent Shipment Table ── */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-[0_10px_35px_rgba(15,23,42,0.02)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Shipment</h2>
            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Status overview of all active fleet nodes</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-550 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold shadow-sm">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-1.5 px-3.5 py-1.5 border border-slate-200 text-slate-550 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold shadow-sm">
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button 
              onClick={onAddDevice}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-750 transition-colors text-xs font-bold shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Load</span>
            </button>
          </div>
        </div>

        {/* Table container */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 text-[10px] uppercase tracking-wider font-extrabold border-b border-slate-100">
                <th className="py-3 px-4 w-12 text-center">
                  <input type="checkbox" className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" />
                </th>
                <th className="py-3 px-4">Vehicle Code</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Arrival Time</th>
                <th className="py-3 px-4">Durations</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60">
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs italic font-medium">
                    No registered devices found.
                  </td>
                </tr>
              ) : (
                devices.map((device) => {
                  const isChecked = selectedDashboardDevice?.deviceId === device.deviceId;
                  const routeName = PRESET_ROUTES[device.deviceId] || PRESET_ROUTES.default;
                  const activeTime = device.sampleTime 
                    ? new Date(device.sampleTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '---';

                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-50 border border-slate-200 text-slate-400">
                      Inactive
                    </span>
                  );
                  if (device.status === 'active') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-green-50 border border-green-200 text-green-700">
                        In Delivery
                      </span>
                    );
                  } else if (device.status === 'maintenance') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-50 border border-amber-200 text-amber-700">
                        In Repair
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={device.deviceId}
                      onClick={() => onDeviceSelect(device, true)}
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => setSelectedDashboardDevice(device)}
                          className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" 
                        />
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-xs text-slate-700">{device.deviceId}</td>
                      <td className="py-3 px-4 font-bold text-xs text-slate-700">{device.displayName || 'Unassigned'}</td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-500">{activeTime}</td>
                      <td className="py-3 px-4 font-semibold text-xs text-slate-500">
                        {device.status === 'active' ? 'Active' : '---'}
                      </td>
                      <td className="py-3 px-4 text-xs font-bold text-indigo-650 flex items-center space-x-1 mt-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{routeName}</span>
                      </td>
                      <td className="py-3 px-4">{statusBadge}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

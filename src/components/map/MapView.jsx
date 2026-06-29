import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl/maplibre';
import { MapPin, Navigation2 } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapView({ devices = [], geofences = [], onDeviceClick }) {
  const mapRef = useRef();
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: 105.804817,
    latitude: 21.028511,
    zoom: 12
  });

  // Fit bounds to show all devices
  useEffect(() => {
    if (devices.length > 0 && mapRef.current) {
      const bounds = devices.reduce(
        (acc, device) => {
          return {
            minLng: Math.min(acc.minLng, device.position[0]),
            maxLng: Math.max(acc.maxLng, device.position[0]),
            minLat: Math.min(acc.minLat, device.position[1]),
            maxLat: Math.max(acc.maxLat, device.position[1]),
          };
        },
        {
          minLng: devices[0].position[0],
          maxLng: devices[0].position[0],
          minLat: devices[0].position[1],
          maxLat: devices[0].position[1],
        }
      );

      mapRef.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 100, duration: 1000 }
      );
    }
  }, [devices.length]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {/* Device Markers */}
        {devices.map((device) => (
          <Marker
            key={device.deviceId}
            longitude={device.position[0]}
            latitude={device.position[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedDevice(device);
              onDeviceClick?.(device);
            }}
          >
            <div className="relative cursor-pointer group">
              <div className="absolute -inset-2 bg-aws-orange opacity-20 rounded-full animate-ping"></div>
              <div className="relative bg-aws-orange text-white p-2 rounded-full shadow-aws-lg group-hover:scale-110 transition-transform">
                <Navigation2 className="w-5 h-5" />
              </div>
            </div>
          </Marker>
        ))}

        {/* Selected Device Popup */}
        {selectedDevice && (
          <Popup
            longitude={selectedDevice.position[0]}
            latitude={selectedDevice.position[1]}
            anchor="top"
            onClose={() => setSelectedDevice(null)}
            closeButton={true}
            closeOnClick={false}
            className="device-popup"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-aws-gray-900 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-aws-orange" />
                {selectedDevice.deviceId}
              </h3>
              <div className="space-y-1 text-sm text-aws-gray-600">
                <p>
                  <span className="font-medium">Position:</span>{' '}
                  {selectedDevice.position[1].toFixed(6)}, {selectedDevice.position[0].toFixed(6)}
                </p>
                {selectedDevice.accuracy && (
                  <p>
                    <span className="font-medium">Accuracy:</span>{' '}
                    {selectedDevice.accuracy.Horizontal}m
                  </p>
                )}
                {selectedDevice.sampleTime && (
                  <p>
                    <span className="font-medium">Last Update:</span>{' '}
                    {new Date(selectedDevice.sampleTime).toLocaleString()}
                  </p>
                )}
                {selectedDevice.properties && Object.keys(selectedDevice.properties).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-aws-gray-200">
                    <p className="font-medium mb-1">Properties:</p>
                    {Object.entries(selectedDevice.properties).map(([key, value]) => (
                      <p key={key} className="text-xs">
                        {key}: {value}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Popup>
        )}

        {/* Geofence Layers */}
        {/* TODO: Add geofence polygons rendering */}
      </Map>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-aws p-4 max-w-xs">
        <h4 className="font-semibold text-aws-gray-900 mb-2">Legend</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-aws-orange rounded-full"></div>
            <span className="text-aws-gray-700">Active Device</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
            <span className="text-aws-gray-700">Geofence Zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

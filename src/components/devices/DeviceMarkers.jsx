import { Marker, Popup } from 'react-map-gl/maplibre';
import { Navigation2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Easing function for smooth movement
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const SmoothMarker = ({ device, deviceId, targetPos, statusColor, onClick }) => {
  const [currentPos, setCurrentPos] = useState(targetPos);
  const startPosRef = useRef(targetPos);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!targetPos || !currentPos) return;

    // If identical target, do nothing
    if (targetPos[0] === currentPos[0] && targetPos[1] === currentPos[1]) {
      return;
    }

    // Capture the exact moment and position we start animating from
    startPosRef.current = currentPos;
    startTimeRef.current = performance.now();
    const duration = 2000; // 2 seconds fluid movement

    const animate = (time) => {
      let timeFraction = (time - startTimeRef.current) / duration;
      if (timeFraction > 1) timeFraction = 1;

      const progress = easeInOutCubic(timeFraction);

      const newLng = startPosRef.current[0] + (targetPos[0] - startPosRef.current[0]) * progress;
      const newLat = startPosRef.current[1] + (targetPos[1] - startPosRef.current[1]) * progress;

      setCurrentPos([newLng, newLat]);

      if (timeFraction < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        console.log(`[SmoothMarker] Arrived at target: [${targetPos}]`);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetPos[0], targetPos[1]]);

  if (!currentPos || currentPos.length < 2) return null;

  return (
    <Marker
      longitude={currentPos[0]}
      latitude={currentPos[1]}
      anchor="center"
      onClick={onClick}
    >
      <div className="relative cursor-pointer group">
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-75"
          style={{ backgroundColor: statusColor }}
        />
        <div
          className="relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition-transform group-hover:scale-110"
          style={{ backgroundColor: statusColor }}
        >
          <Navigation2 className="w-5 h-5 text-white" />
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {deviceId}
        </div>
      </div>
    </Marker>
  );
};

const DeviceMarkers = ({ devices = [], onDeviceClick }) => {
  const [popupInfo, setPopupInfo] = useState(null);

  const getDeviceId = (device) => device.DeviceId || device.deviceId;
  const getPosition = (device) => device.Position || device.position;
  const getSampleTime = (device) => device.SampleTime || device.sampleTime;
  const getAccuracy = (device) => device.Accuracy || device.accuracy;
  const getProperties = (device) => device.PositionProperties || device.properties;

  const getStatusColor = (device) => {
    const sampleTime = getSampleTime(device);
    if (!sampleTime) return '#9CA3AF';
    const lastUpdate = new Date(sampleTime);
    const now = new Date();
    const diffMinutes = (now - lastUpdate) / 1000 / 60;

    if (diffMinutes < 5) return '#10B981'; // green
    if (diffMinutes < 30) return '#F59E0B'; // yellow
    return '#EF4444'; // red
  };

  return (
    <>
      {devices.map((device) => {
        const deviceId = getDeviceId(device);
        const position = getPosition(device);

        if (!position || position.length < 2) return null;

        const statusColor = getStatusColor(device);

        return (
          <SmoothMarker
            key={deviceId}
            device={device}
            deviceId={deviceId}
            targetPos={position}
            statusColor={statusColor}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setPopupInfo(device);
              if (onDeviceClick) onDeviceClick(device);
            }}
          />
        );
      })}

      {popupInfo && (
        <Popup
          longitude={getPosition(popupInfo)[0]}
          latitude={getPosition(popupInfo)[1]}
          anchor="top"
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
          className="device-popup"
        >
          <div className="p-2 min-w-[200px]">
            <h3 className="font-semibold text-aws-gray-900 mb-2 flex items-center">
              <Navigation2 className="w-4 h-4 mr-2 text-aws-orange" />
              {getDeviceId(popupInfo)}
            </h3>

            <div className="space-y-1 text-sm text-aws-gray-700">
              <div className="flex justify-between">
                <span className="text-aws-gray-600">Latitude:</span>
                <span className="font-medium">{getPosition(popupInfo)[1].toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-aws-gray-600">Longitude:</span>
                <span className="font-medium">{getPosition(popupInfo)[0].toFixed(6)}</span>
              </div>

              {getAccuracy(popupInfo) && (
                <div className="flex justify-between">
                  <span className="text-aws-gray-600">Accuracy:</span>
                  <span className="font-medium">{getAccuracy(popupInfo).Horizontal}m</span>
                </div>
              )}

              {getSampleTime(popupInfo) && (
                <div className="flex justify-between">
                  <span className="text-aws-gray-600">Last Update:</span>
                  <span className="font-medium">
                    {new Date(getSampleTime(popupInfo)).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {getProperties(popupInfo) && (
              <div className="mt-3 pt-2 border-t border-aws-gray-200">
                <div className="text-xs font-medium text-aws-gray-600 mb-1">Properties:</div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(getProperties(popupInfo)).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-aws-gray-100 text-aws-gray-700"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Popup>
      )}
    </>
  );
};

export default DeviceMarkers;

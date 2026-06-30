import { useState, useEffect } from 'react';
import { Source, Layer } from 'react-map-gl/maplibre';
import { deviceApi } from '../../api/deviceApi';

const historyLineLayer = {
    id: 'device-history-line',
    type: 'line',
    paint: {
        'line-color': '#4F46E5', // Indigo
        'line-width': 3,
        'line-opacity': 0.7,
    },
};

const historyPointsLayer = {
    id: 'device-history-points',
    type: 'circle',
    paint: {
        'circle-radius': 3,
        'circle-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#4338CA',
    },
};

export default function DeviceHistoryPathLayer({ deviceId, liveDevice, isVisible }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        let active = true;
        if (deviceId && isVisible) {
            deviceApi.getHistory(deviceId)
                .then(res => {
                    if (active) {
                        // AWS history positions come sorted by sampleTime desc (newest first).
                        // Or rather we should sort just in case
                        const sorted = [...(res.data || [])].sort(
                            (a, b) => new Date(a.SampleTime) - new Date(b.SampleTime)
                        );
                        console.log(`[History] Loaded ${sorted.length} points for ${deviceId}`);
                        setHistory(sorted);
                    }
                })
                .catch(err => console.error('Failed to fetch history:', err));
        } else {
            setHistory([]);
        }
        return () => { active = false; };
    }, [deviceId, isVisible]);

    // Lắng nghe vị trí real-time và nối tiếp vào lịch sử đang có
    useEffect(() => {
        if (!liveDevice || !liveDevice.position || !liveDevice.sampleTime) return;

        setHistory(prev => {
            const newPoint = { Position: liveDevice.position, SampleTime: liveDevice.sampleTime };

            if (prev.length === 0) {
                return [newPoint];
            }

            const lastPoint = prev[prev.length - 1];
            const liveTime = new Date(liveDevice.sampleTime).getTime();
            const lastTime = new Date(lastPoint.SampleTime).getTime();

            // Chỉ thêm nếu toạ độ này thực sự mới hơn điểm cuối cùng
            if (liveTime > lastTime) {
                console.log(`[History] Real-time point added for ${liveDevice.deviceId}`);
                return [...prev, newPoint];
            }

            return prev;
        });
    }, [liveDevice]);

    // We need at least 1 point to draw anything
    if (!history || history.length === 0 || !isVisible) {
        if (isVisible) console.log(`[History] No points to display for ${deviceId}`);
        return null;
    }

    // AWS Position is [longitude, latitude]
    const coordinates = history.map(pos => pos.Position);

    const geojsonLine = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates,
        },
    };

    const geojsonPoints = {
        type: 'FeatureCollection',
        features: history.map(pos => ({
            type: 'Feature',
            properties: { sampleTime: pos.SampleTime },
            geometry: { type: 'Point', coordinates: pos.Position }
        }))
    };

    return (
        <>
            {coordinates.length >= 2 && (
                <Source id={`history-line-source-${deviceId}`} type="geojson" data={geojsonLine}>
                    <Layer {...historyLineLayer} id={`history-line-layer-${deviceId}`} />
                </Source>
            )}
            <Source id={`history-points-source-${deviceId}`} type="geojson" data={geojsonPoints}>
                <Layer {...historyPointsLayer} id={`history-points-layer-${deviceId}`} />
            </Source>
        </>
    );
}

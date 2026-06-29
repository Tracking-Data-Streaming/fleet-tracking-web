import { useEffect, useState, useCallback, useRef } from "react";
import { useMap, Source, Layer } from "react-map-gl/maplibre";
import {
  ListGeofencesCommand,
  BatchDeleteGeofenceCommand,
  PutGeofenceCommand,
} from "@aws-sdk/client-location";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { GEOFENCE } from "../../configuration";
import GeofencesPanel from "./GeofencesPanel";
import DrawControl from "./DrawControl";
import DrawnGeofences from "./DrawnGeofences";
import { MapPin, X, CircleDot } from "lucide-react";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

// ─── Draw instance ────────────────────────────────────────────────────────

const draw = new MapboxDraw({
  displayControlsDefault: false,
  defaultMode: "simple_select",
  styles: [
    {
      id: "gl-draw-line",
      type: "line",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#FF9900", "line-width": 2 },
    },
    {
      id: "gl-draw-polygon-fill",
      type: "fill",
      paint: { "fill-color": "#FF9900", "fill-opacity": 0.2 },
    },
    {
      id: "gl-draw-point",
      type: "circle",
      paint: { "circle-radius": 6, "circle-color": "#FF9900" },
    },
  ],
});

// ─── Helpers ──────────────────────────────────────────────────────────────

const convertCounterClockwise = (vertices) => {
  let area = 0;
  for (let i = 0; i < vertices.length; i++) {
    const j = (i + 1) % vertices.length;
    area += vertices[i][0] * vertices[j][1];
    area -= vertices[j][0] * vertices[i][1];
  }
  return area / 2 > 0 ? vertices : vertices.reverse();
};

const callListGeofencesCommand = async (client) => {
  if (!client) return null;
  return client.send(new ListGeofencesCommand({ CollectionName: GEOFENCE }));
};

const callBatchDeleteGeofenceCommand = async (client, geofenceIds) => {
  if (!client) return null;
  return client.send(
    new BatchDeleteGeofenceCommand({ CollectionName: GEOFENCE, GeofenceIds: geofenceIds })
  );
};

const callPutGeofenceCommand = async (client, polygon, geofenceId) => {
  if (!client) return null;
  try {
    const id = geofenceId || "Geofence-" + Date.now();
    return await client.send(
      new PutGeofenceCommand({
        CollectionName: GEOFENCE,
        GeofenceId: id,
        Geometry: { Polygon: [polygon] },
      })
    );
  } catch (error) {
    if (error.name === "ConflictException") {
      console.log(`Geofence ${geofenceId} already exists. Skipping.`);
      return null;
    }
    throw error;
  }
};

/**
 * Build a circle GeoJSON polygon via turf.
 * @param {[number,number]} center [lng, lat]
 * @param {number}          radiusM radius in metres
 */
const buildCirclePolygon = (center, radiusM) => {
  const circle = turf.circle(center, radiusM / 1000, {
    steps: 64,
    units: "kilometers",
  });
  return circle.geometry.coordinates[0]; // array of [lng, lat]
};

// ─── GeofencesLayer ───────────────────────────────────────────────────────

const CIRCLE_STEPS = {
  IDLE: "idle",
  CENTER: "center",  // waiting for user to click center
  RADIUS: "radius",  // center selected, adjusting radius
  SAVING: "saving",
};

const GeofencesLayer = ({
  readOnlyLocationClient,
  writeOnlyLocationClient,
  isOpenedPanel,
  onPanelChange,
  isDrawing,
  onDrawingChange,
  breachingGeofences,
}) => {
  const { current: map } = useMap();

  // Polygon mode state
  const [geofences, setGeofences] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [geofencesVisible, setGeofencesVisible] = useState(true);
  const [isAddingGeofence, setIsAddingGeofence] = useState(false);
  const [totalGeofences, setTotalGeofences] = useState();
  const [isGeofenceCompletable, setIsGeofenceCompletable] = useState(false);
  const [drawnPolygon, setDrawnPolygon] = useState(null);
  const [drawInstance, setDrawInstance] = useState(null);

  // Circle mode state
  const [circleStep, setCircleStep] = useState(CIRCLE_STEPS.IDLE);
  const [circleCenter, setCircleCenter] = useState(null); // [lng, lat]
  const [circleRadiusM, setCircleRadiusM] = useState(500);  // metres
  const [circleGeoJSON, setCircleGeoJSON] = useState(null); // preview GeoJSON

  // Keep radius in a ref so the map click handler always has the latest value
  const circleRadiusRef = useRef(circleRadiusM);
  useEffect(() => { circleRadiusRef.current = circleRadiusM; }, [circleRadiusM]);

  // ── Fetch geofences ────────────────────────────────────────────────────

  const fetchGeofences = useCallback(async () => {
    if (!readOnlyLocationClient) return;
    setIsLoading(true);
    try {
      const res = await callListGeofencesCommand(readOnlyLocationClient);
      setTotalGeofences(res.Entries.length);
      setGeofences(res.Entries.reverse().slice(0, 10));
    } catch (err) {
      console.error("Error fetching geofences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [readOnlyLocationClient]);

  useEffect(() => {
    if (readOnlyLocationClient) fetchGeofences();
  }, [readOnlyLocationClient, fetchGeofences]);

  useEffect(() => {
    if (isOpenedPanel) {
      fetchGeofences();
    } else {
      onDrawingChange(false);
      setIsGeofenceCompletable(false);
      exitCircleMode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpenedPanel, onDrawingChange]);

  // Polygon draw mode sync
  useEffect(() => {
    if (draw) {
      draw.changeMode(isDrawing ? "draw_polygon" : "simple_select");
    }
  }, [isDrawing]);

  // ── Circle mode — map click handler ────────────────────────────────────

  useEffect(() => {
    if (!map || circleStep !== CIRCLE_STEPS.CENTER) return;

    const handleMapClick = (e) => {
      const center = [e.lngLat.lng, e.lngLat.lat];
      setCircleCenter(center);
      setCircleStep(CIRCLE_STEPS.RADIUS);

      // Build initial preview
      const coords = buildCirclePolygon(center, circleRadiusRef.current);
      setCircleGeoJSON({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
      });
    };

    map.on("click", handleMapClick);
    map.getCanvas().style.cursor = "crosshair";

    return () => {
      map.off("click", handleMapClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, circleStep]);

  // Live-update circle preview when radius changes
  useEffect(() => {
    if (circleCenter && circleStep === CIRCLE_STEPS.RADIUS) {
      const coords = buildCirclePolygon(circleCenter, circleRadiusM);
      setCircleGeoJSON({
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
      });
    }
  }, [circleCenter, circleRadiusM, circleStep]);

  // ── Circle mode helpers ────────────────────────────────────────────────

  const enterCircleMode = () => {
    // Make sure polygon mode is off
    onDrawingChange(false);
    if (draw) draw.changeMode("simple_select");
    setDrawnPolygon(null);

    setCircleStep(CIRCLE_STEPS.CENTER);
    setCircleCenter(null);
    setCircleRadiusM(500);
    setCircleGeoJSON(null);
  };

  const exitCircleMode = () => {
    setCircleStep(CIRCLE_STEPS.IDLE);
    setCircleCenter(null);
    setCircleGeoJSON(null);
    if (map) map.getCanvas().style.cursor = "";
  };

  // ── Polygon mode handlers ──────────────────────────────────────────────

  const handleDeleteGeofences = async (ids) => {
    if (ids.length > 0) {
      await callBatchDeleteGeofenceCommand(writeOnlyLocationClient, ids);
      fetchGeofences();
    }
  };

  const handleCreate = useCallback(
    (e) => {
      if (e.features?.length > 0) {
        const polygon = convertCounterClockwise(
          e.features[0].geometry.coordinates[0]
        );
        setDrawnPolygon(polygon);
        setIsGeofenceCompletable(false);
        setTimeout(() => onDrawingChange(false), 100);
      }
    },
    [onDrawingChange]
  );

  const handleSavePolygonGeofence = async () => {
    if (!drawnPolygon) return;
    setIsAddingGeofence(true);
    try {
      const result = await callPutGeofenceCommand(writeOnlyLocationClient, drawnPolygon);
      if (result?.CreateTime) {
        await fetchGeofences();
        draw.deleteAll();
        setDrawnPolygon(null);
        onDrawingChange(false);
        alert("Geofence saved successfully!");
      } else {
        alert("There was an error saving the geofence. Please try again.");
      }
    } catch (err) {
      console.error("Error saving geofence:", err);
      alert(`Error saving geofence: ${err.message}`);
    } finally {
      setIsAddingGeofence(false);
    }
  };

  const handleCancelPolygonDrawing = () => {
    try {
      const d = drawInstance || draw;
      if (d && typeof d.getAll === "function") {
        const features = d.getAll();
        if (features?.features?.length > 0) {
          const f = features.features[0];
          if (
            f.geometry.type === "Polygon" &&
            f.geometry.coordinates[0].length >= 4
          ) {
            const polygon = convertCounterClockwise(f.geometry.coordinates[0]);
            setDrawnPolygon(polygon);
            onDrawingChange(false);
            setIsGeofenceCompletable(false);
            return;
          }
        }
        d.deleteAll();
      }
    } catch (err) {
      console.error("Error in handleCancelPolygonDrawing:", err);
    }
    setDrawnPolygon(null);
    onDrawingChange(false);
    setIsGeofenceCompletable(false);
  };

  const handleModeChange = useCallback(
    (e) => {
      if (e.mode === "simple_select") {
        onDrawingChange(false);
        setIsGeofenceCompletable(false);
      }
    },
    [onDrawingChange]
  );

  // ── Save circle geofence ───────────────────────────────────────────────

  const handleSaveCircleGeofence = async () => {
    if (!circleCenter) return;
    setCircleStep(CIRCLE_STEPS.SAVING);
    try {
      const polygon = buildCirclePolygon(circleCenter, circleRadiusM);
      const ccw = convertCounterClockwise(polygon);
      const result = await callPutGeofenceCommand(writeOnlyLocationClient, ccw);
      if (result?.CreateTime) {
        await fetchGeofences();
        exitCircleMode();
        alert("Circle geofence saved successfully!");
      } else {
        setCircleStep(CIRCLE_STEPS.RADIUS);
        alert("There was an error saving the geofence. Please try again.");
      }
    } catch (err) {
      console.error("Error saving circle geofence:", err);
      setCircleStep(CIRCLE_STEPS.RADIUS);
      alert(`Error saving geofence: ${err.message}`);
    }
  };

  // ── Radius label helper ────────────────────────────────────────────────

  const formatRadius = (m) =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Geofences toggle button */}
      <div className="absolute top-4 left-4 z-10">
        <button
          onClick={() =>
            isOpenedPanel ? onPanelChange() : onPanelChange("geofences")
          }
          className="btn-primary flex items-center space-x-2 shadow-aws-lg"
        >
          <MapPin className="w-5 h-5" />
          <span>Geofences</span>
        </button>
      </div>

      {/* Geofences panel */}
      {isOpenedPanel && (
        <GeofencesPanel
          onClose={() => onPanelChange()}
          geofences={geofences}
          onDeleteGeofences={handleDeleteGeofences}
          onAddPolygonGeofence={() => onDrawingChange(true)}
          onAddCircleGeofence={enterCircleMode}
          isLoading={isLoading}
          geofencesVisible={geofencesVisible}
          onToggleGeofences={() => setGeofencesVisible((p) => !p)}
          totalGeofences={totalGeofences}
        />
      )}

      {/* mapbox-gl-draw control */}
      <DrawControl
        draw={draw}
        onCreate={handleCreate}
        onModeChange={handleModeChange}
        onGeofenceCompletable={(c) => setIsGeofenceCompletable(c)}
        onDrawReady={setDrawInstance}
      />

      {/* ── Polygon drawing UI ── */}
      {isDrawing && !drawnPolygon && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-aws-gray-900">Draw Polygon Geofence</h3>
            <button onClick={handleCancelPolygonDrawing} className="text-aws-gray-500 hover:text-aws-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-aws-gray-700 space-y-2">
            {isGeofenceCompletable ? (
              <>
                <p className="font-medium text-aws-orange">Almost done!</p>
                <p>Click the <strong>first point</strong> (orange dot) to close the shape.</p>
              </>
            ) : (
              <>
                <p className="font-medium">How to draw:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Click on the map to add points</li>
                  <li>Add at least 3 points</li>
                  <li>Click the first point to close the shape</li>
                  <li>Then click Save</li>
                </ol>
              </>
            )}
          </div>
          <button onClick={handleCancelPolygonDrawing} className="mt-4 w-full btn-secondary text-sm">
            Cancel
          </button>
        </div>
      )}

      {/* Polygon ready to save */}
      {drawnPolygon && !isAddingGeofence && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-aws-gray-900">Polygon Geofence Ready</h3>
            <button onClick={handleCancelPolygonDrawing} className="text-aws-gray-500 hover:text-aws-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-green-600 font-medium mb-1">✓ Polygon drawn successfully!</p>
          <p className="text-xs text-aws-gray-600 mb-4">
            Click "Save" to submit to AWS or "Discard" to start over.
          </p>
          <div className="space-y-2">
            <button onClick={handleSavePolygonGeofence} className="w-full btn-primary flex items-center justify-center space-x-2">
              <span>Save Geofence</span>
            </button>
            <button onClick={handleCancelPolygonDrawing} className="w-full btn-secondary text-sm">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Polygon saving spinner */}
      {isAddingGeofence && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <h3 className="font-semibold text-aws-gray-900 mb-3">Saving Geofence...</h3>
          <div className="flex items-center space-x-2 text-sm text-aws-gray-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-aws-orange"></div>
            <p>Saving to AWS Location Service...</p>
          </div>
        </div>
      )}

      {/* ── Circle drawing UI — step: CENTER ── */}
      {circleStep === CIRCLE_STEPS.CENTER && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CircleDot className="w-5 h-5 text-aws-orange" />
              <h3 className="font-semibold text-aws-gray-900">Draw Circle Geofence</h3>
            </div>
            <button onClick={exitCircleMode} className="text-aws-gray-500 hover:text-aws-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-aws-gray-700 space-y-2">
            <p className="font-medium text-aws-orange animate-pulse">Click on the map to set the center point</p>
            <p className="text-xs text-aws-gray-600">
              The cursor will change to a crosshair. Click anywhere on the map to place the center of the circle.
            </p>
          </div>
          <button onClick={exitCircleMode} className="mt-4 w-full btn-secondary text-sm">
            Cancel
          </button>
        </div>
      )}

      {/* ── Circle drawing UI — step: RADIUS ── */}
      {circleStep === CIRCLE_STEPS.RADIUS && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <CircleDot className="w-5 h-5 text-aws-orange" />
              <h3 className="font-semibold text-aws-gray-900">Adjust Radius</h3>
            </div>
            <button onClick={exitCircleMode} className="text-aws-gray-500 hover:text-aws-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center coords */}
          <div className="bg-aws-gray-50 rounded-lg p-2 mb-4 text-xs text-aws-gray-600 font-mono">
            Center: {circleCenter?.[1].toFixed(5)}, {circleCenter?.[0].toFixed(5)}
          </div>

          {/* Radius label */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-aws-gray-700">Radius</span>
            <span className="text-sm font-bold text-aws-orange">{formatRadius(circleRadiusM)}</span>
          </div>

          {/* Slider */}
          <input
            type="range"
            min={100}
            max={50000}
            step={100}
            value={circleRadiusM}
            onChange={(e) => setCircleRadiusM(Number(e.target.value))}
            className="w-full h-2 bg-aws-gray-200 rounded-lg appearance-none cursor-pointer accent-aws-orange mb-3"
          />

          {/* Preset buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {[250, 500, 1000, 2000, 5000].map((m) => (
              <button
                key={m}
                onClick={() => setCircleRadiusM(m)}
                className={`text-xs px-2 py-1 rounded-full border transition-colors ${circleRadiusM === m
                  ? "bg-aws-orange text-white border-aws-orange"
                  : "bg-white text-aws-gray-600 border-aws-gray-300 hover:border-aws-orange hover:text-aws-orange"
                  }`}
              >
                {formatRadius(m)}
              </button>
            ))}
          </div>

          {/* Custom input */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="number"
              min={100}
              max={50000}
              step={100}
              value={circleRadiusM}
              onChange={(e) => setCircleRadiusM(Math.max(100, Math.min(50000, Number(e.target.value))))}
              className="flex-1 px-3 py-1.5 border border-aws-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-aws-orange"
            />
            <span className="text-sm text-aws-gray-600">metres</span>
          </div>

          <div className="space-y-2">
            <button onClick={handleSaveCircleGeofence} className="w-full btn-primary flex items-center justify-center space-x-2">
              <CircleDot className="w-4 h-4" />
              <span>Save Circle Geofence</span>
            </button>
            <button onClick={exitCircleMode} className="w-full btn-secondary text-sm">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* ── Circle saving spinner ── */}
      {circleStep === CIRCLE_STEPS.SAVING && (
        <div className="absolute top-16 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 p-4 z-50">
          <h3 className="font-semibold text-aws-gray-900 mb-3">Saving Circle Geofence...</h3>
          <div className="flex items-center space-x-2 text-sm text-aws-gray-700">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-aws-orange"></div>
            <p>Saving to AWS Location Service...</p>
          </div>
        </div>
      )}

      {/* ── Circle preview on map ── */}
      {circleGeoJSON && (
        <Source id="circle-preview" type="geojson" data={circleGeoJSON}>
          <Layer
            id="circle-preview-fill"
            type="fill"
            paint={{ "fill-color": "#3B82F6", "fill-opacity": 0.15 }}
          />
          <Layer
            id="circle-preview-outline"
            type="line"
            paint={{ "line-color": "#3B82F6", "line-width": 2, "line-dasharray": [4, 2] }}
          />
        </Source>
      )}

      {/* Saved geofences on map */}
      <DrawnGeofences
        geofences={geofences}
        breachingGeofences={breachingGeofences}
        geofencesVisible={geofencesVisible}
      />
    </>
  );
};

export default GeofencesLayer;

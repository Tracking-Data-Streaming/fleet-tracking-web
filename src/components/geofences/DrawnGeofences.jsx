import { useMemo } from "react";
import { Source, Layer } from "react-map-gl/maplibre";

// Format geofence data into GeoJSON
const getGeometryJson = (geofences) => {
  const features = geofences.map((geofence) => ({
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: geofence.Geometry?.Polygon,
    },
  }));

  return {
    type: "FeatureCollection",
    features,
  };
};

// Properties for the polygons
const polygons = {
  id: "polygons",
  type: "fill",
  source: "drawn-geofences",
  paint: {
    "fill-color": "#FF9900",
    "fill-opacity": 0.3,
  },
};

const polygonsBorders = {
  id: "polygons-borders",
  type: "line",
  source: "drawn-geofences",
  paint: {
    "line-color": "#FF9900",
    "line-width": 2,
  },
};

const polygonsBreached = {
  id: "polygonsBreached",
  type: "fill",
  source: "drawn-geofences-breached",
  paint: {
    "fill-color": "#dc2626",
    "fill-opacity": 0.4,
  },
};

const polygonsBreachedBorders = {
  id: "polygons-breached-borders",
  type: "line",
  source: "drawn-geofences-breached",
  paint: {
    "line-color": "#dc2626",
    "line-width": 2,
  },
};

// Drawn geofences on the map
const DrawnGeofences = ({
  geofences,
  breachingGeofences,
  geofencesVisible,
}) => {
  const geofenceJson = useMemo(
    () =>
      getGeometryJson(
        geofences.filter(
          (item) => !breachingGeofences.includes(item.GeofenceId)
        )
      ),
    [geofences, breachingGeofences]
  );
  const breachingGeofenceJson = useMemo(
    () =>
      getGeometryJson(
        geofences.filter((item) => breachingGeofences.includes(item.GeofenceId))
      ),
    [geofences, breachingGeofences]
  );
  
  if (geofencesVisible) {
    return (
      <>
        <Source id="drawn-geofences" type="geojson" data={geofenceJson}>
          <Layer {...polygons} />
          <Layer {...polygonsBorders} />
        </Source>
        <Source
          id="drawn-geofences-breached"
          type="geojson"
          data={breachingGeofenceJson}
        >
          <Layer {...polygonsBreached} />
          <Layer {...polygonsBreachedBorders} />
        </Source>
      </>
    );
  } else {
    return null;
  }
};

export default DrawnGeofences;

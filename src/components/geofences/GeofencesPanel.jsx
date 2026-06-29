import { useState } from "react";
import { X, Trash2, Eye, EyeOff, CircleDot, PenLine, Plus } from "lucide-react";
import { GEOFENCE } from "../../configuration";

const GeofencesPanel = ({
  onClose,
  geofences,
  onDeleteGeofences,
  onAddPolygonGeofence,
  onAddCircleGeofence,
  isLoading,
  onToggleGeofences,
  geofencesVisible,
  totalGeofences,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);

  const handleSelectionChange = (geofenceId) => {
    setSelectedItems((prev) =>
      prev.includes(geofenceId)
        ? prev.filter((id) => id !== geofenceId)
        : [...prev, geofenceId]
    );
  };

  const handleDeleteGeofences = () => {
    onDeleteGeofences(selectedItems);
    setSelectedItems([]);
  };

  return (
    <div className="absolute top-16 left-4 w-80 bg-white rounded-lg shadow-aws-lg border border-aws-gray-200 z-10">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-aws-gray-200">
        <h2 className="text-base font-semibold text-aws-gray-900">Geofences</h2>
        <button
          onClick={onClose}
          className="text-aws-gray-400 hover:text-aws-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Draw new geofence ── */}
      <div className="px-4 py-3 border-b border-aws-gray-100 bg-aws-gray-50">
        <p className="text-xs font-medium text-aws-gray-500 uppercase tracking-wide mb-2">
          Draw New Geofence
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAddPolygonGeofence}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-sm font-medium border border-aws-gray-300 rounded-lg bg-white text-aws-gray-700 hover:border-aws-orange hover:text-aws-orange transition-colors"
          >
            <PenLine className="w-4 h-4" />
            <span>Polygon</span>
          </button>
          <button
            onClick={onAddCircleGeofence}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-sm font-medium rounded-lg bg-aws-orange text-white hover:bg-orange-600 transition-colors"
          >
            <CircleDot className="w-4 h-4" />
            <span>Circle</span>
          </button>
        </div>
      </div>

      {/* ── Geofence list ── */}
      <div className="p-4 max-h-72 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aws-orange"></div>
          </div>
        ) : geofences?.length > 0 ? (
          <div>
            <div className="text-xs text-aws-gray-500 mb-2">
              Collection: <span className="font-medium text-aws-gray-700">{GEOFENCE}</span>
            </div>
            <div className="space-y-1">
              {geofences.map((geofence) => (
                <label
                  key={geofence.GeofenceId}
                  className="flex items-center space-x-3 p-2 hover:bg-aws-gray-50 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(geofence.GeofenceId)}
                    onChange={() => handleSelectionChange(geofence.GeofenceId)}
                    className="w-4 h-4 text-aws-orange border-aws-gray-300 rounded focus:ring-aws-orange"
                  />
                  <span className="text-sm text-aws-gray-900 flex-1 truncate">
                    {geofence.GeofenceId}
                  </span>
                </label>
              ))}
            </div>
            {totalGeofences > 10 && (
              <div className="text-xs text-aws-gray-500 mt-3 italic">
                Showing {geofences?.length} of {totalGeofences}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <CircleDot className="w-8 h-8 mx-auto mb-2 text-aws-gray-300" />
            <p className="text-sm text-aws-gray-600">No geofences yet.</p>
            <p className="text-xs text-aws-gray-500 mt-1">Use Polygon or Circle above to create one.</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-aws-gray-200">
        <button
          onClick={handleDeleteGeofences}
          disabled={selectedItems.length === 0}
          className="flex items-center space-x-1.5 text-sm text-red-600 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove ({selectedItems.length})</span>
        </button>

        <button
          onClick={onToggleGeofences}
          className="flex items-center space-x-1.5 text-sm text-aws-gray-600 hover:text-aws-gray-900 transition-colors"
        >
          {geofencesVisible ? (
            <>
              <EyeOff className="w-4 h-4" />
              <span>Hide</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              <span>Show</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default GeofencesPanel;

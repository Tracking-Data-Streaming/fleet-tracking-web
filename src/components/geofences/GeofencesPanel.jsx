import { useState } from "react";
import { X, Trash2, Eye, EyeOff, CircleDot, PenLine } from "lucide-react";
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
    <div className="absolute top-16 left-4 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_15px_35px_rgba(15,23,42,0.1)] border border-slate-200/80 z-10 overflow-hidden select-none">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Geofences</h2>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-650 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Draw new geofence ── */}
      <div className="px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
          Draw New Geofence
        </p>
        <div className="flex gap-2">
          <button
            onClick={onAddPolygonGeofence}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-colors shadow-sm"
          >
            <PenLine className="w-4 h-4" />
            <span>Polygon</span>
          </button>
          <button
            onClick={onAddCircleGeofence}
            className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <CircleDot className="w-4 h-4" />
            <span>Circle</span>
          </button>
        </div>
      </div>

      {/* ── Geofence list ── */}
      <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : geofences?.length > 0 ? (
          <div>
            <div className="text-[10px] text-slate-400 font-semibold mb-2.5">
              Collection: <span className="font-bold text-slate-600">{GEOFENCE}</span>
            </div>
            <div className="space-y-1">
              {geofences.map((geofence) => (
                <label
                  key={geofence.GeofenceId}
                  className="flex items-center space-x-3 p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(geofence.GeofenceId)}
                    onChange={() => handleSelectionChange(geofence.GeofenceId)}
                    className="w-4 h-4 text-indigo-650 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 flex-1 truncate">
                    {geofence.GeofenceId}
                  </span>
                </label>
              ))}
            </div>
            {totalGeofences > 10 && (
              <div className="text-[10px] text-slate-400 mt-3 italic font-medium">
                Showing {geofences?.length} of {totalGeofences}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <CircleDot className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-655">No geofences yet.</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Use Polygon or Circle above to create one.</p>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
        <button
          onClick={handleDeleteGeofences}
          disabled={selectedItems.length === 0}
          className="flex items-center space-x-1.5 text-xs font-bold text-red-650 hover:text-red-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Remove ({selectedItems.length})</span>
        </button>

        <button
          onClick={onToggleGeofences}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
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

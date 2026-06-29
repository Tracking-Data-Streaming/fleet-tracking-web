import { Trash2, X } from 'lucide-react';

export default function DeleteDeviceModal({ deviceId, isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-aws-lg max-w-sm w-full mx-4">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-aws-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-aws-gray-900">Delete Device</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-aws-gray-400 hover:text-aws-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-aws-gray-700 mb-2">
            Are you sure you want to delete this device?
          </p>
          <div className="bg-aws-gray-50 rounded-lg p-3 mt-4">
            <p className="text-sm text-aws-gray-600">Device:</p>
            <p className="text-sm font-semibold text-aws-gray-900 break-all">{deviceId}</p>
          </div>
          <p className="text-xs text-aws-gray-500 mt-4">
            This action cannot be undone. The device record and its position history will be permanently removed.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-aws-gray-200 bg-aws-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-aws-gray-700 bg-white border border-aws-gray-300 rounded-lg hover:bg-aws-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

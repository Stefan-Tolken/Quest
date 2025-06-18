// SaveConfirmationPopup.tsx
import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveConfirmationPopupProps {
  isEditMode: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SaveConfirmationPopup = ({ isEditMode, onConfirm, onCancel }: SaveConfirmationPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Confirm Save</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {isEditMode 
              ? "Are you sure you want to save these changes to your quest?" 
              : "Are you sure you want to create this quest?"
            }
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2 hover:cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              className="px-6 py-2 hover:cursor-pointer"
            >
              {isEditMode ? "Save Changes" : "Create Quest"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
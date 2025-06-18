// Add this component to your quest builder file or create a separate component file

import { CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SaveConfirmationPopupProps {
  isEditMode: boolean;
  onClose: () => void;
}

export const SaveSuccessPopup = ({ isEditMode, onClose }: SaveConfirmationPopupProps) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Success!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600 mb-6">
            {isEditMode 
              ? "Your quest has been updated successfully!" 
              : "Your quest has been created successfully!"
            }
          </p>
          
          <div className="flex justify-end">
            <Button
              onClick={onClose}
              className="px-6 py-2 hover:cursor-pointer"
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessPopupProps {
  message: string;
  onOk: () => void;
}

const SuccessPopup: React.FC<SuccessPopupProps> = ({ message, onOk }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-lg shadow-xl border p-6 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Success
            </h3>
            <p className="text-sm text-gray-500">
              Operation completed successfully.
            </p>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-700">
            {message}
          </p>
        </div>
        
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={onOk}
            className="hover:cursor-pointer"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessPopup;
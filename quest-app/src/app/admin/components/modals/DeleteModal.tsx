import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteModalProps {
  type: "artefact" | "quest";
  warning?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function DeleteModal({ type, warning, onCancel, onConfirm }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-lg shadow-xl border p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Trash className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Delete {type === 'artefact' ? 'Artefact' : 'Quest'}
            </h3>
            <p className="text-sm text-gray-500">This action cannot be undone.</p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-6">
          {warning || `Are you sure you want to delete this ${type}? This will permanently remove it.`}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {!warning && (
            <Button variant="destructive" onClick={onConfirm}>
              <Trash className="h-4 w-4 mr-2" />
              Delete {type === 'artefact' ? 'Artefact' : 'Quest'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

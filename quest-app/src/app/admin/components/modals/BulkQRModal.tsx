import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Artefact } from "@/lib/types";

interface BulkQRModalProps {
  artefacts: Artefact[];
  imageType: "png" | "jpg" | "jpeg";
  format: "pdf" | "images";
  setImageType: (type: "png" | "jpg" | "jpeg") => void;
  setFormat: (format: "pdf" | "images") => void;
  isLoading: boolean;
  onClose: () => void;
  onDownload: (selectedArtefacts: Artefact[]) => void | Promise<void>;
}

export default function BulkQRModal({
  artefacts,
  imageType,
  format,
  setImageType,
  setFormat,
  isLoading,
  onClose,
  onDownload
}: BulkQRModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Download QR Codes ({artefacts.length} selected)
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Download Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">Download Format</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                value="images"
                checked={format === "images"}
                onChange={() => setFormat("images")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Individual Images</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                value="pdf"
                checked={format === "pdf"}
                onChange={() => setFormat("pdf")}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm">Single PDF File</span>
            </label>
          </div>

          {/* Image Type */}
          {format === "images" && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Image Format</label>
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value as any)}
                className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="jpeg">JPEG</option>
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => onDownload(artefacts)} 
              disabled={isLoading} 
              className="flex-1 flex items-center justify-center gap-2">
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

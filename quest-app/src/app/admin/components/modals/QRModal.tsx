import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import QRCodeGenerator from "@/components/QRGenerator";
import { Artefact } from "@/lib/types";

interface QRModalProps {
  artefact: Artefact;
  contentType: "png" | "jpg" | "jpeg";
  setContentType: (type: "png" | "jpg" | "jpeg") => void;
  onClose: () => void;
  onDownload: () => void;
}

export default function QRModal({ 
  artefact, 
  contentType, 
  setContentType, 
  onClose, 
  onDownload 
}: QRModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            QR Code for {artefact.name}
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div id="qr-popup" className="flex flex-col items-center gap-6">
          <QRCodeGenerator 
            data={{ artefactId: artefact.id }} 
            size={200} 
            className="bg-gray-50 p-4 rounded-lg" 
          />

          <div className="flex gap-3 w-full">
            <Button 
              onClick={onDownload} 
              variant="default" 
              size="default"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download as {contentType.toUpperCase()}
            </Button>

            <div className="relative">
              <select
                value={contentType}
                onChange={(e) => setContentType(e.target.value as "png" | "jpg" | "jpeg")}
                className="appearance-none bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer min-w-[80px]"
              >
                <option value="png">PNG</option>
                <option value="jpg">JPG</option>
                <option value="jpeg">JPEG</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="default"
              onClick={onClose} 
              className="flex-1"
            >
              Close
            </Button>
          </div>
        </div>

        {artefact.artist && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Artist: {artefact.artist}
          </div>
        )}
      </div>
    </div>
  );
}
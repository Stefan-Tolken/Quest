"use client";

import React, { useMemo } from "react";
import { useData } from "@/context/dataContext";
import { useState, useEffect } from "react";
import SuccessPopup from "@/components/ui/SuccessPopup";
import QRModal from "./components/modals/QRModal";
import BulkQRModal from "./components/modals/BulkQRModal";
import DeleteModal from "./components/modals/DeleteModal";
import QuestsTable from "./components/QuestTabel";
import ArtefactsTable from "./components/ArtefactsTabel";
import { Artefact } from "@/lib/types";
import AdminDashboardSkeleton from "./components/AdminDashboardSkeleton";

export default function AdminHome() {
  const { artefacts, quests, loading } = useData();
  const [initialLoading, setInitialLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"artefact" | "quest" | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<string>("");
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  
  // QR Code popup state
  const [showQRPopup, setShowQRPopup] = useState(false);
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [contentType, setContentType] = useState<"png" | "jpg" | "jpeg">("png");
  
  // Bulk QR Download state
  const [showBulkQRPopup, setShowBulkQRPopup] = useState(false);
  const [bulkDownloadType, setBulkDownloadType] = useState<"pdf" | "images">("images");
  const [bulkImageType, setBulkImageType] = useState<"png" | "jpg" | "jpeg">("png");
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [selectedArtefactsForBulk, setSelectedArtefactsForBulk] = useState<Artefact[]>([]);

  // Memoize data to prevent unnecessary re-renders and re-computations
  const memoizedQuests = useMemo(() => quests, [quests]);
  const memoizedArtefacts = useMemo(() => artefacts, [artefacts]);

  useEffect(() => {
    // Only show loading screen if data is still loading
    if (!loading) {
      const timer = setTimeout(() => {
        setInitialLoading(false);
      }, 300); // Reduced loading time since data is already available
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleArtefactQR = useMemo(() => 
    (artefact: Artefact) => {
      setSelectedArtefact(artefact);
      setShowQRPopup(true);
    }, []
  );

  const handleQRDownload = useMemo(() => 
    () => {
      if (!selectedArtefact) return;
      
      const svg = document.querySelector('#qr-popup svg') as SVGElement;
      if (!svg) return;

      // Create a canvas to convert SVG to image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // Determine MIME type and quality based on selected format
        let mimeType = 'image/png';
        let quality = 1;
        let extension = 'png';
        
        if (contentType === 'jpg' || contentType === 'jpeg') {
          mimeType = 'image/jpeg';
          quality = 0.95;
          extension = contentType;
        }
        
        // Download the image
        const imageUrl = canvas.toDataURL(mimeType, quality);
        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl;
        downloadLink.download = `qr-code-${selectedArtefact.name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.${extension}`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    }, [selectedArtefact, contentType]
  );

  const handleBulkDownloadLambda = useMemo(() => 
    async (selectedArtefacts: Artefact[]) => {
      if (selectedArtefacts.length === 0) {
        alert('Please select at least one artefact to download QR codes.');
        return;
      }
      
      setSelectedArtefactsForBulk(selectedArtefacts);
      setIsGeneratingBulk(false);
      setShowBulkQRPopup(true);
    }, []
  );

  const executeBulkDownload = useMemo(() => 
  async (selectedArtefacts: Artefact[]) => {
    setIsGeneratingBulk(true);
    
    try {
      console.log('Sending request with:', {
        artefacts: selectedArtefacts,
        format: bulkDownloadType,
        imageType: bulkImageType
      });

      const response = await fetch('/api/lambda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artefacts: selectedArtefacts,
          format: bulkDownloadType,
          imageType: bulkImageType
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response text:', errorText);
        
        let error;
        try {
          error = JSON.parse(errorText);
        } catch (e) {
          error = { error: errorText };
        }
        
        console.error('Parsed error:', error);
        throw new Error(error.error || error.details || error.message || 'Failed to generate QR codes');
      }

      const result = await response.json();
      const { downloadUrl } = result;
      
      if (!downloadUrl) {
        throw new Error('No download URL received from server');
      }
      
      if (bulkDownloadType === 'pdf') {
        alert('If nothing happens, please ensure popups are not blocked for this site.');
        window.open(downloadUrl, '_blank');
      } else {
        // Download the file (images/zip)
        const downloadLink = document.createElement('a');
        downloadLink.href = downloadUrl;
        downloadLink.download = `qr-codes-bulk-${Date.now()}.zip`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setShowBulkQRPopup(false);
      setSelectedArtefactsForBulk([]);
      
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error generating QR codes:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      alert(`Error generating QR codes: ${errorMessage}`);
    } finally {
      setIsGeneratingBulk(false);
    }
  }, [bulkDownloadType, bulkImageType]
);

  const handleDeleteArtefact = useMemo(() => 
    async (id: string) => {
      // Check if artefact is used in any quest
      const res = await fetch("/api/check-artifact-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artefactId: id }),
      });
      const data = await res.json();
      if (data.usedIn && data.usedIn.length > 0) {
        setDeleteWarning(
          `This artefact is used in the following quest(s):\n${data.usedIn
            .map((q: { title: string }) => q.title)
            .join(", ")}. You must remove it from all quests before deleting.`
        );
        setDeletingId(id);
        setDeleteType("artefact");
        return;
      }
      setDeleteWarning("");
      setDeletingId(id);
      setDeleteType("artefact");
    }, []
  );

  const handleDeleteQuest = useMemo(() => 
    (id: string) => {
      setDeletingId(id);
      setDeleteType("quest");
      setDeleteWarning("");
    }, []
  );

  const confirmDelete = useMemo(() => 
    async () => {
      if (!deletingId || !deleteType) return;
      const url = deleteType === "artefact" ? "/api/delete-artifact" : "/api/delete-quest";
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deletingId }),
      });
      if (res.ok) {
        setShowDeleteSuccess(true);
        setTimeout(() => window.location.reload(), 1200);
      }
      setDeletingId(null);
      setDeleteType(null);
    }, [deletingId, deleteType]
  );

  // Show loading state
  if (initialLoading || loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your quests and artefacts here.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Quests Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <QuestsTable 
              quests={memoizedQuests} 
              onDeleteQuest={handleDeleteQuest} 
            />
          </div>

          {/* Artefacts Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <ArtefactsTable 
              artefacts={memoizedArtefacts} 
              onDeleteArtefact={handleDeleteArtefact} 
              onBulkQRDownload={handleBulkDownloadLambda} 
              onGenerateQR={handleArtefactQR} 
            />
          </div>
        </div>
      </div>
      
      {/* QR Code Popup Modal */}
      {showQRPopup && selectedArtefact && (
        <QRModal
          artefact={selectedArtefact}
          contentType={contentType}
          setContentType={setContentType}
          onClose={() => {
            setShowQRPopup(false);
            setSelectedArtefact(null);
          }}
          onDownload={handleQRDownload}
        />
      )}

      {/* Bulk QR Code Download Popup */}
      {showBulkQRPopup && (
        <BulkQRModal
          artefacts={selectedArtefactsForBulk}
          imageType={bulkImageType}
          format={bulkDownloadType}
          setImageType={setBulkImageType}
          setFormat={setBulkDownloadType}
          isLoading={isGeneratingBulk}
          onClose={() => {
            setShowBulkQRPopup(false);
            setSelectedArtefactsForBulk([]);
          }}
          onDownload={(selectedArtefacts) => { void executeBulkDownload(selectedArtefacts); }}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      {deletingId && deleteType && (
        <DeleteModal
          type={deleteType}
          warning={deleteWarning}
          onCancel={() => {
            setDeletingId(null);
            setDeleteType(null);
            setDeleteWarning("");
          }}
          onConfirm={confirmDelete}
        />
      )}

      {/* Success Popup */}
      {showDeleteSuccess && (
        <SuccessPopup message="Deleted successfully!" onOk={() => window.location.reload()} />
      )}
    </div>
  );
}
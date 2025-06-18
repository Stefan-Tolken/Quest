"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Wrench, Calendar, Building, FileText, Image as ImageIcon, Upload, Plus, Trash2, X, Eye, EyeOff } from "lucide-react";
import { RestorationContent } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface RestorationProps {
  content: RestorationContent;
  onUpdate: (content: RestorationContent) => void;
}

interface RestorationStep {
  id: string;
  name: string;
  date: string;
  description: string;
  imageUrl: string;
  organization: string;
}

export const RestorationComponent = ({ content, onUpdate }: RestorationProps) => {
  // Add a ref to track initial mount and prevent initial update
  const initialMount = useRef(true);
  
  const [restorations, setRestorations] = useState<RestorationStep[]>(
    (content.restorations || []).map(r => ({
      ...r,
      organization: r.organization ?? ""
    }))
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editingRestoration, setEditingRestoration] = useState<RestorationStep | null>(null);
  const [formData, setFormData] = useState<RestorationStep>({
    id: "",
    name: "",
    date: "",
    description: "",
    imageUrl: "",
    organization: "",
  });

  // Smart preposition selector based on date format
  const getDatePreposition = (date: string): string => {
    if (!date || date === "unknown") return "on";
    
    const lowerDate = date.toLowerCase().trim();
    
    // Check for century patterns
    if (lowerDate.includes("century") || lowerDate.includes("centuries")) {
      return "in the";
    }
    
    // Check for decade patterns (1990s, 2000s, etc.)
    if (lowerDate.match(/\b\d{4}s\b/) || lowerDate.includes("decade")) {
      return "in the";
    }
    
    // Check for year ranges (1990-1995, 2000 to 2005, etc.)
    if (lowerDate.match(/\d{4}\s*[-–—to]\s*\d{4}/) || lowerDate.includes(" to ")) {
      return "between";
    }
    
    // Check for periods/eras
    if (lowerDate.includes("period") || lowerDate.includes("era") || 
        lowerDate.includes("early") || lowerDate.includes("late") || 
        lowerDate.includes("mid")) {
      return "in the";
    }
    
    // Check for seasons with year (Spring 2024, Winter 1995)
    if (lowerDate.match(/\b(spring|summer|fall|autumn|winter)\s+\d{4}/)) {
      return "in";
    }
    
    // Check for month/year combinations (March 2024, January 1995)
    if (lowerDate.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/)) {
      return "in";
    }
    
    // Check for just years (2024, 1995)
    if (lowerDate.match(/^\d{4}$/)) {
      return "in";
    }
    
    // Check for approximate dates (circa, around, about)
    if (lowerDate.includes("circa") || lowerDate.includes("around") || 
        lowerDate.includes("about") || lowerDate.includes("approximately")) {
      return "in";
    }
    
    // Default to "on" for specific dates (March 15, 2024, etc.)
    return "on";
  };

  // Generate the restoration sentence with proper grammar
  const generateRestorationSentence = (restoration: RestorationStep): string => {
    const name = restoration.name || "[Restoration name]";
    const organization = restoration.organization || "[Organization]";
    const date = restoration.date;
    const description = restoration.description || "[Description will appear here]";
    
    if (date === "unknown") {
      return `${name} was done by ${organization} on an unknown date. ${description}`;
    }
    
    const preposition = getDatePreposition(date);
    const dateText = date || "[Date]";
    
    return `${name} was done by ${organization} ${preposition} ${dateText}. ${description}`;
  };

  // Fix the infinite loop by adding proper dependency checks
  useEffect(() => {
    // Skip the initial update to prevent the cycle
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    
    // Compare current restorations with content.restorations to avoid unnecessary updates
    const currentRestorationsString = JSON.stringify(restorations);
    const contentRestorationsString = JSON.stringify(content.restorations || []);
    
    if (currentRestorationsString !== contentRestorationsString) {
      onUpdate({ restorations });
    }
  }, [restorations, onUpdate, content.restorations]);

  const openAddModal = () => {
    setFormData({
      id: crypto.randomUUID(),
      name: "",
      date: "",
      description: "",
      imageUrl: "",
      organization: "",
    });
    setEditingRestoration(null);
    setShowAddModal(true);
  };

  const openEditModal = (restoration: RestorationStep) => {
    setFormData({ ...restoration });
    setEditingRestoration(restoration);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingRestoration(null);
    setFormData({
      id: "",
      name: "",
      date: "",
      description: "",
      imageUrl: "",
      organization: "",
    });
  };

  const handleSave = () => {
    let updatedRestorations;
    if (editingRestoration) {
      // Update existing restoration
      updatedRestorations = restorations.map(r => 
        r.id === editingRestoration.id ? formData : r
      );
    } else {
      // Add new restoration
      updatedRestorations = [...restorations, formData];
    }
    
    setRestorations(updatedRestorations);
    // Don't call onUpdate here as the useEffect will handle it
    closeModal();
  };

  const deleteRestoration = (id: string) => {
    const updatedRestorations = restorations.filter(restoration => restoration.id !== id);
    setRestorations(updatedRestorations);
    // Don't call onUpdate here as the useEffect will handle it
  };

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const isFormValid = formData.name && formData.organization && formData.description;

  return (
    <div>
      {/* Component Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
            {Wrench && <Wrench size={16} className="text-red-600" />}
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-gray-900 text-sm">Restoration Timeline</h5>
            <p className="text-xs text-gray-600">Track restoration history</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
          >
            {showPreview ? (
              <>
                {EyeOff && <EyeOff size={16} />}
                Hide Preview
              </>
            ) : (
              <>
                {Eye && <Eye size={16} />}
                Show Preview
              </>
            )}
          </button>

          {/* Add Restoration Button */}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 font-medium border border-red-200 hover:border-red-300"
          >
            {Plus && <Plus size={16} />}
            Add Restoration
          </button>
        </div>
      </div>

      {/* Restorations List */}
      <div className="space-y-4">
        {restorations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {Wrench && <Wrench size={32} className="mx-auto mb-2 text-gray-400" />}
            <p>No restorations added yet.</p>
            <p className="text-sm">Click &quot;Add Restoration&quot; to get started.</p>
          </div>
        ) : (
          restorations.map((restoration, index) => (
            <div key={restoration.id} className="relative">
              {/* Timeline connector */}
              {index < restorations.length - 1 && (
                <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-200 z-0"></div>
              )}
              
              <div className="flex gap-4 relative z-10">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                </div>
                
                {/* Content Card */}
                <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <h6 className="font-medium text-gray-900">{restoration.name || "Untitled Restoration"}</h6>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(restoration)}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                        title="Edit restoration"
                      >
                        {FileText && <FileText size={14} />}
                      </button>
                      <button
                        onClick={() => deleteRestoration(restoration.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Delete restoration"
                      >
                        {Trash2 && <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Restoration Sentence with Smart Grammar */}
                  <p className="text-sm text-gray-700 mb-3">
                    {generateRestorationSentence(restoration).split('.').map((sentence, idx, arr) => (
                      <span key={idx}>
                        {idx === 0 ? (
                          // First sentence with proper styling
                          sentence.split(' ').map((word, wordIdx, words) => {
                            const isName = wordIdx < words.findIndex(w => w === 'was');
                            const isOrg = wordIdx > words.findIndex(w => w === 'by') && 
                                         wordIdx < words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                            const isDate = wordIdx > words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                            
                            if (isName && word !== 'was') {
                              return <span key={wordIdx} className="font-medium">{word} </span>;
                            } else if (isOrg && !['was', 'done', 'by'].includes(word)) {
                              return <span key={wordIdx} className="font-medium">{word} </span>;
                            } else if (isDate && !['on', 'in', 'between', 'the', 'an', 'unknown'].includes(word)) {
                              return <span key={wordIdx} className="font-medium">{word} </span>;
                            }
                            return <span key={wordIdx}>{word} </span>;
                          })
                        ) : (
                          // Remaining sentences
                          <span className="text-gray-600">{sentence}</span>
                        )}
                        {idx < arr.length - 1 && '. '}
                      </span>
                    ))}
                  </p>

                  {/* Image */}
                  {restoration.imageUrl && (
                    <div className="relative h-90 w-full rounded-md overflow-hidden bg-gray-100">
                      <Image
                        src={restoration.imageUrl}
                        alt={restoration.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview Section */}
      {showPreview && restorations.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            {Eye && <Eye size={16} className="text-gray-600" />}
            <h4 className="font-medium text-gray-900">Live Preview</h4>
          </div>
          <div className="space-y-3">
            {restorations.map((restoration, index) => (
              <div key={restoration.id} className="flex items-start gap-3 text-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                  <span className="text-xs font-medium text-red-600">{index + 1}</span>
                </div>
                <p className="text-gray-700">
                  {generateRestorationSentence(restoration).split('.').map((sentence, idx, arr) => (
                    <span key={idx}>
                      {idx === 0 ? (
                        // First sentence with styling
                        sentence.split(' ').map((word, wordIdx, words) => {
                          const isName = wordIdx < words.findIndex(w => w === 'was');
                          const isOrg = wordIdx > words.findIndex(w => w === 'by') && 
                                       wordIdx < words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                          const isDate = wordIdx > words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                          
                          if (isName && word !== 'was') {
                            return <span key={wordIdx} className="font-medium text-gray-900">{word} </span>;
                          } else if (isOrg && !['was', 'done', 'by'].includes(word)) {
                            return <span key={wordIdx} className="font-medium text-gray-900">{word} </span>;
                          } else if (isDate && !['on', 'in', 'between', 'the', 'an', 'unknown'].includes(word)) {
                            return <span key={wordIdx} className="font-medium text-gray-900">{word} </span>;
                          }
                          return <span key={wordIdx}>{word} </span>;
                        })
                      ) : (
                        sentence
                      )}
                      {idx < arr.length - 1 && '. '}
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingRestoration ? "Edit Restoration" : "Add New Restoration"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {X && <X size={24} />}
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* Live Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Live Preview:</p>
                <p className="text-gray-800">
                  {generateRestorationSentence(formData).split('.').map((sentence, idx, arr) => (
                    <span key={idx}>
                      {idx === 0 ? (
                        // First sentence with conditional styling
                        sentence.split(' ').map((word, wordIdx, words) => {
                          const isName = wordIdx < words.findIndex(w => w === 'was');
                          const isOrg = wordIdx > words.findIndex(w => w === 'by') && 
                                       wordIdx < words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                          const isDate = wordIdx > words.findIndex(w => ['on', 'in', 'between'].some(prep => w.includes(prep)));
                          
                          if (isName && word !== 'was' && !word.includes('[')) {
                            return <span key={wordIdx} className="font-semibold text-gray-900">{word} </span>;
                          } else if (isOrg && !['was', 'done', 'by'].includes(word) && !word.includes('[')) {
                            return <span key={wordIdx} className="font-semibold text-gray-900">{word} </span>;
                          } else if (isDate && !['on', 'in', 'between', 'the', 'an', 'unknown'].includes(word) && !word.includes('[')) {
                            return <span key={wordIdx} className="font-semibold text-gray-900">{word} </span>;
                          } else if (word.includes('[') && word.includes(']')) {
                            return <span key={wordIdx} className="text-gray-400">{word} </span>;
                          }
                          return <span key={wordIdx}>{word} </span>;
                        })
                      ) : (
                        <span className={sentence.includes('[') ? "text-gray-400" : "text-gray-700"}>
                          {sentence}
                        </span>
                      )}
                      {idx < arr.length - 1 && '. '}
                    </span>
                  ))}
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {/* Restoration Name */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Restoration Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Frame restoration, Canvas cleaning"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Organization */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Organization <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="e.g., National Gallery Conservation Lab"
                    className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.date === "unknown" ? "" : formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="e.g., 1995, March 2024, 19th century, 1990s, 1990-1995"
                      disabled={formData.date === "unknown"}
                      className="flex-1 h-10 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={formData.date === "unknown"}
                        onChange={(e) => setFormData({
                          ...formData,
                          date: e.target.checked ? "unknown" : ""
                        })}
                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      Unknown date
                    </label>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <p><strong>Examples:</strong></p>
                    <p>• Specific dates: &quot;March 15, 2024&quot; → uses &quot;on&quot;</p>
                    <p>• Years: &quot;1995&quot; → uses &quot;in&quot;</p>
                    <p>• Centuries: &quot;19th century&quot; → uses &quot;in the&quot;</p>
                    <p>• Decades: &quot;1990s&quot; → uses &quot;in the&quot;</p>
                    <p>• Ranges: &quot;1990-1995&quot; → uses &quot;between&quot;</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Description/Method <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the restoration method, techniques used, or process details..."
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-vertical"
                  />
                  <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">
                      {formData.description.length} characters
                    </span>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Restoration Image
                  </label>
                  <div
                    className={`relative w-full border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      formData.imageUrl
                        ? "border-gray-200 aspect-video"
                        : "border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 p-6"
                    }`}
                    onClick={() => document.getElementById('restoration-file-input')?.click()}
                  >
                    <input
                      id="restoration-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    
                    {formData.imageUrl ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={formData.imageUrl}
                          alt="Restoration preview"
                          fill
                          className="object-contain rounded-md"
                        />
                        {/* Overlay on hover */}
                        <div className="absolute opacity-0 inset-0 bg-transparent hover:opacity-100 hover:bg-black/20 transition-all duration-200 rounded-md flex items-center justify-center group">
                          <div className="invisible group-hover:visible bg-white rounded-lg p-2 shadow-lg">
                            {Upload && <Upload size={20} className="text-gray-600" />}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {ImageIcon && <ImageIcon size={24} className="text-gray-400" />}
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-700">Click to select restoration image</p>
                          <p className="text-sm text-gray-500 mt-1">Before/after photos or process documentation</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-white">
              <Button
                variant="outline"
                onClick={closeModal}
                className="flex-1 sm:flex-none"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!isFormValid}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2"
              >
                {Wrench && <Wrench size={16} />}
                {editingRestoration ? "Update Restoration" : "Add Restoration"}
              </Button>
            </div>
          </div>
        </div>
      )}      
      
      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-red-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};
// app/admin/page-builder/components/detailsComponent.tsx
import React, { useState } from 'react';
import { Calendar, MapPin, Ruler, Package, Info, Eye, EyeOff, Diamond } from 'lucide-react';
import { ArtifactDetails } from '@/lib/types';

interface DetailsComponentProps {
  content: ArtifactDetails;
  onUpdate: (content: ArtifactDetails) => void;
}

export const DetailsComponent = ({ content, onUpdate }: DetailsComponentProps) => {
  const [showPreview, setShowPreview] = useState(true);

  const handleInputChange = (field: keyof ArtifactDetails, value: string) => {
    onUpdate({
      ...content,
      [field]: value
    });
  };

  const fieldConfig = [
    {
      key: 'created' as keyof ArtifactDetails,
      label: 'Created',
      icon: Calendar,
      placeholder: 'e.g., May 24, 2025 or 15th century',
      color: 'blue'
    },
    {
      key: 'origin' as keyof ArtifactDetails,
      label: 'Origin',
      icon: MapPin,
      placeholder: 'e.g., Ancient Rome, Egypt',
      color: 'green'
    },
    {
      key: 'currentLocation' as keyof ArtifactDetails,
      label: 'Current Location',
      icon: MapPin,
      placeholder: 'e.g., British Museum, London',
      color: 'purple'
    },
    {
      key: 'dimensions' as keyof ArtifactDetails,
      label: 'Dimensions',
      icon: Ruler,
      placeholder: 'e.g., 15 x 10 x 5 cm',
      color: 'orange'
    },
    {
      key: 'materials' as keyof ArtifactDetails,
      label: 'Materials',
      icon: Package,
      placeholder: 'e.g., Clay, Bronze, Stone',
      color: 'red'
    },
    {
      key: 'type' as keyof ArtifactDetails,
      label: 'Type',
      icon: Diamond,
      placeholder: 'e.g., Sculpture, Painting, Weapon',
      color: 'red'
    }
  ];

  return (
    <div>
      {/* Component Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center group-hover:bg-orange-100 transition-colors">
            <Info size={16} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <h5 className="font-medium text-gray-900 text-sm">Artifact Details</h5>
          </div>
        </div>
        
        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex ml-5 items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
        >
          {showPreview ? (
            <>
              <EyeOff size={16} />
              Hide Preview
            </>
          ) : (
            <>
              <Eye size={16} />
              Show Preview
            </>
          )}
        </button>
      </div>
      
      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {fieldConfig.map(({ key, label, icon: Icon, placeholder, color }) => (
          <div key={key} className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Icon className={`w-4 h-4 text-gray-700`} />
              {label}
            </label>
            <input
              type="text"
              value={content[key] || ''}
              onChange={(e) => handleInputChange(key, e.target.value)}
              placeholder={placeholder}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-gray-700`}
            />
          </div>
        ))}
      </div>

      {/* Preview Section */}
      {showPreview && (
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 transition-all duration-300">
          <div className="flex items-center gap-2 mb-3">
            <Eye size={16} className="text-gray-600" />
            <h4 className="font-medium text-gray-900">Live Preview</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fieldConfig.map(({ key, label, icon: Icon }) => (
              <div key={key} className="flex items-center gap-2 text-sm">
                <Icon className="w-4 h-4 text-gray-700" />
                <span className="font-medium text-gray-700">{label}:</span>
                <span className="text-gray-600 truncate">
                  {content[key] || 'Not specified'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hover State Enhancement */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 -z-10" />
    </div>
  );
};
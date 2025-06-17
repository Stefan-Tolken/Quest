import React from "react";

interface ArtefactsLoadingProps {
  message?: string;
}

// Enhanced loading for when already inside the artifacts page
export const InlineArtefactsLoading: React.FC<ArtefactsLoadingProps> = ({ 
  message = "Loading artifacts..." 
}) => {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-4">
          <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-b-blue-400 rounded-full animate-pulse mx-auto"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-700 font-medium mb-1">{message}</p>
        <p className="text-gray-500 text-sm">This may take a few moments...</p>
        
        {/* Progress bar simulation */}
        <div className="w-48 h-1 bg-gray-200 rounded-full mt-4 mx-auto overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{
            width: '60%',
            animation: 'loadingProgress 2s ease-in-out infinite'
          }}></div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loadingProgress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

// Skeleton loader for artifact form
export const ArtefactFormSkeleton: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="border-b pb-4">
          <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        
        {/* Basic info skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-14 bg-gray-200 rounded"></div>
            <div className="h-14 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Optional info skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-2 gap-6">
            <div className="h-14 bg-gray-200 rounded"></div>
            <div className="h-14 bg-gray-200 rounded"></div>
          </div>
        </div>
        
        {/* Description skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-36 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        
        {/* Image upload skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded border-2 border-dashed border-gray-300"></div>
        </div>
      </div>
    </div>
  );
};

// Component-specific loading for 3D models
export const Model3DLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        {/* Spinner */}
        <div className="relative mb-3">
          <div className="w-8 h-8 border-3 border-blue-100 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
        </div>
        
        {/* Message */}
        <p className="text-gray-600 text-sm">Loading 3D models...</p>
      </div>
    </div>
  );
};

// Page builder skeleton
export const PageBuilderSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
        <div className="flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-4">
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
            <div>
              <div className="h-6 bg-gray-300 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-60"></div>
            </div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-gray-300 rounded w-32"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
            
            <div className="h-6 bg-gray-300 rounded w-40 mt-8"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        
        {/* Main content skeleton */}
        <div className="flex-1 p-6 animate-pulse">
          <div className="space-y-6">
            <div className="h-8 bg-gray-300 rounded w-48"></div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded border"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
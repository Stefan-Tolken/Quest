import React from "react";

interface QuestLoadingProps {
  message?: string;
}

export const QuestLoading: React.FC<QuestLoadingProps> = ({ 
  message = "Loading quest data..." 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full max-w-5xl mx-auto bg-white shadow-sm rounded-lg">
        <div className="p-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center">
              {/* Enhanced loading spinner */}
              <div className="relative mb-6">
                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-blue-400 rounded-full animate-pulse"></div>
              </div>
              
              {/* Loading message */}
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {message}
              </h2>
              <p className="text-gray-600 text-sm">
                Please wait while we prepare your quest...
              </p>
              
              {/* Animated dots */}
              <div className="flex justify-center items-center mt-4 space-x-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced loading for when already inside the quest build page
export const InlineQuestLoading: React.FC<QuestLoadingProps> = ({ 
  message = "Loading quest data..." 
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

// Skeleton loader for quest form
export const QuestFormSkeleton: React.FC = () => {
  return (
    <div className="p-6 animate-pulse">
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="border-b pb-4">
          <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        
        {/* Quest info skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-40 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
        
        {/* Artefacts skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-36 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded flex items-center px-4">
                <div className="w-12 h-12 bg-gray-300 rounded mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Prize section skeleton */}
        <div>
          <div className="h-6 bg-gray-300 rounded w-32 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
};
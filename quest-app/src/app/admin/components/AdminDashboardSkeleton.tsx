import React from 'react';

// Skeleton component for individual table rows
const TableRowSkeleton = ({ columns }: { columns: number }) => (
  <tr className="border-b border-gray-200">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
      </td>
    ))}
  </tr>
);

// Skeleton component for table headers
const TableHeaderSkeleton = ({ columns }: { columns: number }) => (
  <tr className="bg-gray-50">
    {Array.from({ length: columns }).map((_, index) => (
      <th key={index} className="px-6 py-3 text-left">
        <div className="h-4 bg-gray-300 rounded animate-pulse"></div>
      </th>
    ))}
  </tr>
);

// Skeleton for the Quests table section
const QuestsTableSkeleton = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header section */}
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <div className="h-6 bg-gray-300 rounded animate-pulse w-24 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
    </div>
    
    {/* Table */}
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <TableHeaderSkeleton columns={6} />
        </thead>
        <tbody>
          {Array.from({ length: 3 }).map((_, index) => (
            <TableRowSkeleton key={index} columns={6} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Skeleton for the Artefacts table section
const ArtefactsTableSkeleton = () => (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    {/* Header section */}
    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
      <div>
        <div className="h-6 bg-gray-300 rounded animate-pulse w-28 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse w-56"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-36"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse w-32"></div>
      </div>
    </div>
    
    {/* Table */}
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <TableHeaderSkeleton columns={7} />
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRowSkeleton key={index} columns={7} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Main Admin Dashboard Loading Skeleton
export const AdminDashboardSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-gray-50">
    {/* Header Skeleton */}
    <div className="bg-white shadow-sm border-b p-4 flex-shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="h-8 bg-gray-300 rounded animate-pulse w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64"></div>
          </div>
        </div>
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="flex-1 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Quests Section Skeleton */}
        <QuestsTableSkeleton />
        
        {/* Artefacts Section Skeleton */}
        <ArtefactsTableSkeleton />
      </div>
    </div>
  </div>
);

export default AdminDashboardSkeleton;
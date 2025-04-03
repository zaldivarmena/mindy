"use client"
import React, { memo, useState } from 'react';
import { Handle, Position } from '@xyflow/react';

// Custom node component for mind map
function MindMapNode({ data, selected }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine node color based on type or use default
  const getNodeColor = () => {
    switch (data.type) {
      case 'main':
        return 'bg-blue-500 dark:bg-blue-600';
      case 'primary':
        return 'bg-green-500 dark:bg-green-600';
      case 'secondary':
        return 'bg-purple-500 dark:bg-purple-600';
      case 'tertiary':
        return 'bg-amber-500 dark:bg-amber-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  // Get border style based on selection state
  const getBorderStyle = () => {
    if (selected) return 'border-2 border-white ring-2 ring-blue-400';
    if (isHovered) return 'border border-white/80';
    return 'border border-gray-200';
  };

  // Get shadow style based on hover/selection state
  const getShadowStyle = () => {
    if (selected || isHovered) return 'shadow-lg';
    return 'shadow-md';
  };

  return (
    <div 
      className={`px-4 py-3 rounded-lg ${getShadowStyle()} ${getBorderStyle()} min-w-[150px] max-w-[300px] ${getNodeColor()} text-white transition-all duration-200 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className={`w-3 h-3 ${selected ? 'bg-white' : 'bg-teal-500'} transition-colors duration-300`}
      />
      
      {/* Node content */}
      <div className="font-medium text-center mb-1 break-words">{data.label}</div>
      {data.description && (
        <div className="text-xs mt-1 text-white/90 overflow-auto max-h-24 break-words">
          {data.description}
        </div>
      )}
      
      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className={`w-3 h-3 ${selected ? 'bg-white' : 'bg-teal-500'} transition-colors duration-300`}
      />
    </div>
  );
}

// Using memo to optimize rendering performance
export default memo(MindMapNode);

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

  // Determine node size based on type and screen size
  const getNodeSize = () => {
    const isMobile = window.innerWidth < 768;
    
    switch (data.type) {
      case 'main':
        return isMobile ? 'min-w-[120px] max-w-[200px]' : 'min-w-[180px] max-w-[300px]';
      case 'primary':
        return isMobile ? 'min-w-[100px] max-w-[180px]' : 'min-w-[150px] max-w-[250px]';
      case 'secondary':
      case 'tertiary':
        return isMobile ? 'min-w-[80px] max-w-[150px]' : 'min-w-[120px] max-w-[200px]';
      default:
        return isMobile ? 'min-w-[80px] max-w-[150px]' : 'min-w-[120px] max-w-[200px]';
    }
  };

  return (
    <div 
      className={`px-2 sm:px-4 py-2 sm:py-3 rounded-lg ${getShadowStyle()} ${getBorderStyle()} ${getNodeSize()} ${getNodeColor()} text-white transition-all duration-200 ease-in-out ${isHovered ? 'scale-105' : 'scale-100'}`}
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
      <div className="font-medium text-xs sm:text-sm md:text-base text-center mb-1 break-words">{data.label}</div>
      {data.description && (
        <div className="text-[10px] sm:text-xs mt-1 text-white/90 overflow-auto max-h-12 sm:max-h-24 break-words">
          {data.type === 'main' || window.innerWidth >= 768 ? data.description : data.description.length > 50 ? `${data.description.substring(0, 50)}...` : data.description}
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

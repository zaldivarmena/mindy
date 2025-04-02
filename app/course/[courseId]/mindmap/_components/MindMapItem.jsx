"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X, Plus, Trash, Maximize, Minimize, ZoomIn, ZoomOut, Move, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useParams } from 'next/navigation';

function MindMapItem({ mindMap: initialMindMap }) {
  const { courseId } = useParams();
  const [mindMap, setMindMap] = useState(initialMindMap);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  
  const [zoomLevel, setZoomLevel] = useState(1);
  // Set fullscreen to true by default
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [isMovingMode, setIsMovingMode] = useState(false);
  const [autoLayout, setAutoLayout] = useState(true);

  useEffect(() => {
    // Function to set the container size to fill the available space
    const setFullPageSize = () => {
      if (containerRef.current) {
        // Calculate available height (full viewport minus header/navigation)
        const headerOffset = 80; // Estimated header height
        const availableHeight = isFullscreen 
          ? window.innerHeight 
          : window.innerHeight - headerOffset;
        
        // Get the parent container dimensions
        const parentWidth = containerRef.current.parentElement?.offsetWidth || window.innerWidth;
        
        setContainerSize({
          width: parentWidth,
          height: availableHeight
        });
      }
    };
    
    // Set size initially
    setFullPageSize();
    
    // Update on resize
    window.addEventListener('resize', setFullPageSize);
    return () => window.removeEventListener('resize', setFullPageSize);
  }, [containerRef, isFullscreen]);
  
  // Ensure the component is properly sized after initial render
  useEffect(() => {
    // Use a short timeout to ensure the DOM has settled
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.offsetWidth || window.innerWidth;
        const headerOffset = 80;
        const availableHeight = isFullscreen 
          ? window.innerHeight 
          : window.innerHeight - headerOffset;
          
        setContainerSize({
          width: parentWidth,
          height: availableHeight
        });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Effect to adjust view when container size changes
  useEffect(() => {
    // Reset view offset when container size changes to ensure everything is visible
    if (viewOffset.x !== 0 || viewOffset.y !== 0) {
      setViewOffset({ x: 0, y: 0 });
    }
  }, [containerSize]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: window.innerHeight - 100 // Almost full height in fullscreen mode
      });
    } else {
      setContainerSize({
        width: containerRef.current.offsetWidth,
        height: Math.max(800, window.innerHeight * 0.7)
      });
    }
  };
  
  useEffect(() => {
    setMindMap(initialMindMap);
  }, [initialMindMap]);

  if (!mindMap) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No mind map content available for this course yet.</p>
      </div>
    );
  }

  const saveMindMap = async () => {
    try {
      // Find the content record ID first
      const result = await axios.post('/api/study-type', {
        courseId: courseId,
        studyType: 'MindMap'
      });
      
      if (result.data && result.data.id) {
        // Update the content
        await axios.post('/api/update-study-content', {
          id: result.data.id,
          content: mindMap
        });
        setIsEditing(false);
        setSelectedNode(null);
      }
    } catch (error) {
      console.error('Error saving mind map:', error);
      alert('Failed to save mind map. Please try again.');
    }
  };

  const handleNodeClick = (node, path = [], e) => {
    if (isMovingMode) {
      // In moving mode, prepare for dragging
      e.stopPropagation();
      setDraggedNode({ node, path });
      return;
    }
    
    if (isEditing) {
      setSelectedNode({ node, path });
    }
  };
  
  // Simplified movement handling without drag events
  const handleMoveMap = (direction) => {
    if (!isMovingMode) return;
    
    const moveStep = 50 / zoomLevel; // Adjust step size based on zoom level
    
    switch(direction) {
      case 'up':
        setViewOffset(prev => ({ ...prev, y: prev.y + moveStep }));
        break;
      case 'down':
        setViewOffset(prev => ({ ...prev, y: prev.y - moveStep }));
        break;
      case 'left':
        setViewOffset(prev => ({ ...prev, x: prev.x + moveStep }));
        break;
      case 'right':
        setViewOffset(prev => ({ ...prev, x: prev.x - moveStep }));
        break;
    }
  };

  const updateNodeProperty = (property, value) => {
    if (!selectedNode) return;
    
    const { node, path } = selectedNode;
    const newMindMap = JSON.parse(JSON.stringify(mindMap));
    
    // Handle direct update for root node
    if (path.length === 0) {
      newMindMap[property] = value;
      setMindMap(newMindMap);
      return;
    }
    
    // Handle nested nodes
    try {
      let current = newMindMap;
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
          // Make sure the property exists
          if (current[path[i]] && typeof current[path[i]] === 'object') {
            current[path[i]][property] = value;
          }
        } else {
          // Make sure the path and children exist
          if (!current[path[i]] || !current[path[i]].children) {
            console.error('Invalid path or missing children:', path.slice(0, i+1));
            return;
          }
          current = current[path[i]].children;
        }
      }
      
      setMindMap(newMindMap);
    } catch (error) {
      console.error('Error updating node property:', error);
    }
  };

  const addChildNode = () => {
    if (!selectedNode) return;
    
    const { node, path } = selectedNode;
    const newMindMap = JSON.parse(JSON.stringify(mindMap));
    
    try {
      // Handle adding to root node
      if (path.length === 0) {
        if (!newMindMap.children) {
          newMindMap.children = [];
        }
        newMindMap.children.push({
          name: 'New Node',
          description: 'Add description here'
        });
        setMindMap(newMindMap);
        return;
      }
      
      // Handle adding to nested nodes
      let current = newMindMap;
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
          if (!current[path[i]].children) {
            current[path[i]].children = [];
          }
          current[path[i]].children.push({
            name: 'New Node',
            description: 'Add description here'
          });
        } else {
          // Make sure the path and children exist
          if (!current[path[i]] || !current[path[i]].children) {
            console.error('Invalid path or missing children:', path.slice(0, i+1));
            return;
          }
          current = current[path[i]].children;
        }
      }
      
      setMindMap(newMindMap);
    } catch (error) {
      console.error('Error adding child node:', error);
    }
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    
    const { node, path } = selectedNode;
    
    // Don't delete root node
    if (path.length === 0) return;
    
    try {
      const newMindMap = JSON.parse(JSON.stringify(mindMap));
      
      let current = newMindMap;
      for (let i = 0; i < path.length - 1; i++) {
        // Make sure the path and children exist
        if (!current[path[i]] || !current[path[i]].children) {
          console.error('Invalid path or missing children:', path.slice(0, i+1));
          return;
        }
        
        if (i === path.length - 2) {
          // Remove the node at the specified index
          const nodeIndex = path[path.length - 1];
          if (Array.isArray(current[path[i]].children) && nodeIndex < current[path[i]].children.length) {
            current[path[i]].children = current[path[i]].children.filter((_, index) => index !== nodeIndex);
          }
        } else {
          current = current[path[i]].children;
        }
      }
      
      setMindMap(newMindMap);
      setSelectedNode(null);
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  };

  // Simplified layout function to avoid complex calculations
  // Creates a structured hierarchical layout that stays within bounds
  const calculateNodePositions = (node, centerX, centerY, angle, radius, level = 0, parentAngleRange = null) => {
    if (!node) return null;

    // Store position with the node
    const nodeWithPosition = {
      ...node,
      x: centerX,
      y: centerY,
      level
    };

    // If it has children, position them in an arc around this node
    if (node.children && node.children.length > 0) {
      // Count total descendants to allocate appropriate space
      const countDescendants = (n) => {
        if (!n || !n.children || n.children.length === 0) return 1;
        return 1 + n.children.reduce((acc, child) => acc + countDescendants(child), 0);
      };
      
      const totalDescendants = node.children.reduce((acc, child) => acc + countDescendants(child), 0);
      const childCount = node.children.length;
      
      // Use a simpler approach to keep everything in bounds
      // Calculate spacing based on container size and node count
      const maxWidth = containerSize.width * 0.8; // Use 80% of container width
      const maxHeight = containerSize.height * 0.8; // Use 80% of container height
      
      // Calculate spacing that ensures nodes fit within bounds
      const horizontalSpacing = Math.min(maxWidth / Math.max(childCount, 1), 120);
      const verticalSpacing = Math.min(maxHeight / Math.max(childCount, 1), 80);
      
      // Simple alternating layout strategy
      let childPositioningStrategy;
      if (level === 0) {
        childPositioningStrategy = 'horizontal';
      } else if (level === 1) {
        childPositioningStrategy = 'vertical';
      } else {
        childPositioningStrategy = level % 2 === 0 ? 'horizontal' : 'vertical';
      }
      
      // Position children based on the strategy determined by level
      let childrenWithPositions;
      
      if (childPositioningStrategy === 'horizontal') {
        // Horizontal distribution (for root and even levels)
        const totalWidth = (childCount - 1) * horizontalSpacing;
        const startX = centerX - totalWidth / 2;
        
        childrenWithPositions = node.children.map((child, index) => {
          // Ensure child X position stays within container bounds
          const rawChildX = startX + (index * horizontalSpacing);
          const childX = Math.max(50, Math.min(containerSize.width - 50, rawChildX));
          const childY = centerY + verticalSpacing; // All children below parent
          
          // Recursively position the child and its descendants
          return calculateNodePositions(
            child,
            childX,
            childY,
            0,
            radius * 0.9, // Slightly reduce radius for each level
            level + 1,
            null
          );
        });
      } else {
        // Vertical distribution (for odd levels)
        childrenWithPositions = node.children.map((child, index) => {
          const childX = centerX;
          // Ensure child Y position stays within container bounds
          const rawChildY = centerY + ((index + 1) * verticalSpacing);
          const childY = Math.max(50, Math.min(containerSize.height - 50, rawChildY));
          
          return calculateNodePositions(
            child,
            childX,
            childY,
            0,
            radius * 0.9, // Slightly reduce radius for each level
            level + 1,
            null
          );
        });
      }

      // Store the positioned children and their connections
      nodeWithPosition.children = childrenWithPositions;
      nodeWithPosition.childConnections = childrenWithPositions.map(child => ({
        x1: centerX,
        y1: centerY,
        x2: child.x,
        y2: child.y
      }));
    }

    return nodeWithPosition;
  };

  // Create the positioned tree with improved spacing
  // Center the root node to ensure balanced layout
  const centerX = containerSize.width / 2; // Center horizontally
  const centerY = containerSize.height / 5; // Position near the top to allow for vertical growth
  
  // Calculate base radius based on the number of nodes and container size
  const countNodes = (node) => {
    if (!node) return 0;
    let count = 1; // Count this node
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        count += countNodes(child);
      });
    }
    return count;
  };
  
  // Count the maximum depth of the tree
  const getMaxDepth = (node, currentDepth = 0) => {
    if (!node) return currentDepth;
    if (!node.children || node.children.length === 0) return currentDepth;
    
    return Math.max(...node.children.map(child => getMaxDepth(child, currentDepth + 1)));
  };
  
  const totalNodes = countNodes(mindMap);
  const maxDepth = getMaxDepth(mindMap);
  
  // Simplified radius calculation to ensure nodes stay within bounds
  const minDimension = Math.min(containerSize.width, containerSize.height);
  
  // Use a smaller fixed radius to ensure everything fits
  const baseRadius = minDimension * 0.15;
  
  // Position the tree
  let positionedTree;
  try {
    positionedTree = calculateNodePositions(mindMap, centerX, centerY, 0, baseRadius);
  } catch (error) {
    console.error('Error positioning tree:', error);
    // Provide a fallback simple tree if positioning fails
    positionedTree = {
      ...mindMap,
      x: centerX,
      y: centerY,
      level: 0
    };
  }

  // Recursive function to render mind map nodes with their connections
  const renderMindMapNode = (node, path = []) => {
    if (!node) return null;
    
    // Ensure node has x and y coordinates
    if (typeof node.x === 'undefined' || typeof node.y === 'undefined') {
      console.warn('Node missing coordinates:', node);
      return null;
    }

    const isSelected = selectedNode && 
      JSON.stringify(selectedNode.path) === JSON.stringify(path);
    
    const isDragged = draggedNode && 
      JSON.stringify(draggedNode.path) === JSON.stringify(path);

    // Simple, subdued colors for different levels
    const nodeColors = [
      { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800', line: '#9ca3af' }, // Root
      { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', line: '#93c5fd' }, // Level 1
      { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', line: '#a7f3d0' }, // Level 2
      { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', line: '#fde68a' }, // Level 3
      { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', line: '#c4b5fd' }, // Level 4
      { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-800', line: '#fbcfe8' } // Level 5
    ];
    
    const colorSet = nodeColors[node.level % nodeColors.length];

    // Calculate node size based on content, level, and container size
    // Make nodes at deeper levels slightly smaller to prevent overcrowding
    // Also scale based on container size to ensure everything fits
    const containerScale = Math.min(containerSize.width, containerSize.height) / 1000;
    const levelFactor = Math.max(0.6, 1 - (node.level * 0.08));
    const contentLength = (node.name?.length || 0) + (node.description?.length || 0) / 3;
    
    // Calculate width based on content but with reasonable limits
    const baseWidth = Math.max(70, Math.min(180, contentLength * 5 + 30));
    const nodeWidth = baseWidth * levelFactor * Math.max(0.8, Math.min(1.2, containerScale));
    
    // Calculate height based on whether there's a description
    const baseHeight = node.description ? 50 : 32;
    const nodeHeight = baseHeight * levelFactor * Math.max(0.8, Math.min(1.2, containerScale));

    return (
      <React.Fragment key={path.join('-') || 'root'}>
        {/* Render connections to children */}
        {node.childConnections?.map((conn, i) => {
          // Get the child's color for the connection
          const childPath = [...path, 'children', i];
          let childNode = node.children[i];
          const childColorSet = nodeColors[childNode.level % nodeColors.length];
          
          return (
            <g key={`conn-${i}`}>
              {/* Simple straight line for connection */}
              <path
                d={`M ${conn.x1} ${conn.y1} L ${conn.x2} ${conn.y2}`}
                stroke={childColorSet.line}
                strokeWidth="1.5"
                fill="none"
              />
            </g>
          );
        })}

        {/* Render the node */}
        <foreignObject
          x={node.x - nodeWidth / 2}
          y={node.y - nodeHeight / 2}
          width={nodeWidth}
          height={nodeHeight}
          onClick={(e) => handleNodeClick(node, path, e)}
          className={isMovingMode ? 'cursor-move' : ''}
        >
          <div
            className={`p-2 rounded border h-full flex flex-col justify-center overflow-hidden
              ${colorSet.bg} ${colorSet.border} ${colorSet.text}
              ${isSelected ? 'ring-1 ring-blue-400' : ''}
              ${isMovingMode ? 'cursor-move' : ''}`}
            style={{ 
              fontSize: Math.max(12, 16 - (node.level || 0)) + 'px',
              minWidth: '90px',
              minHeight: '36px'
            }}
          >
            <div className="font-medium text-center">{node.name || node.title || 'Unnamed Node'}</div>
            {node.description && (
              <p className="text-xs mt-1 text-center truncate">
                {node.description}
              </p>
            )}
          </div>
        </foreignObject>

        {/* Render children */}
        {node.children?.map((child, index) => 
          renderMindMapNode(child, [...path, 'children', index])
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="relative h-[calc(100vh-100px)]">
      <Card className="w-full h-full mb-4 border-0 shadow-md">
        <CardContent className="p-0 h-full">
          <div className="flex justify-between items-center mb-2 px-4 pt-2">
            <h3 className="text-xl font-bold">
              {mindMap.name || mindMap.title || "Course Mind Map"}
            </h3>
            <div className="flex gap-1">
              {/* Edit button moved to floating panel */}
            </div>
          </div>

          {/* Edit panel moved to floating panel */}

          {/* Controls moved to floating panels */}
          
          <div 
            ref={containerRef} 
            className={`relative border rounded-lg overflow-hidden bg-white ${isFullscreen ? 'fixed top-0 left-0 right-0 bottom-0 z-50' : ''}`}
            style={{ 
              height: containerSize.height + 'px',
              width: '100%', // Keep within parent container
              maxWidth: '100%' // Ensure it doesn't exceed container width
            }}
          >
            <div 
              className="w-full h-full overflow-auto"
              style={{ cursor: isMovingMode ? 'grab' : 'default' }}
            >
              <div 
                className="flex items-center justify-center"
                style={{ 
                  width: '100%',
                  height: '100%',
                }}
              >
                <div style={{ 
                  transform: `scale(${zoomLevel}) translate(${viewOffset.x}px, ${viewOffset.y}px)`, 
                  transformOrigin: 'center center',
                  width: containerSize.width, // Keep within container width
                  height: containerSize.height, // Keep within container height
                  transition: 'transform 0.2s ease',
                  position: 'relative'
                }}>
                  <svg 
                    width="100%" 
                    height="100%"
                    viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {renderMindMapNode(positionedTree)}
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Simple control panel */}
            <div className="absolute bottom-4 right-4 z-20 bg-white border rounded p-2 flex gap-1">
              <Button 
                variant={isMovingMode ? "default" : "outline"} 
                size="sm"
                onClick={() => {
                  setIsMovingMode(!isMovingMode);
                  if (isEditing) setIsEditing(false);
                }}
              >
                <Move className="h-4 w-4 mr-1" />
                <span className="text-xs">Move</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoomLevel(1)}
              >
                {Math.round(zoomLevel * 100)}%
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))}
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setViewOffset({ x: 0, y: 0 });
                  setZoomLevel(1);
                  setMindMap(JSON.parse(JSON.stringify(initialMindMap)));
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              

            </div>
            
            {/* Simple edit button */}
            <div className="absolute top-4 right-4 z-20">
              {isEditing ? (
                <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2">
                  <Button variant="default" size="sm" onClick={() => saveMindMap()}>
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setIsEditing(false);
                    setSelectedNode(null);
                    setMindMap(initialMindMap); // Reset to original
                  }}>
                    <X className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-1" />
                  <span className="text-xs">Edit</span>
                </Button>
              )}
            </div>
            
            {/* Simple node editor */}
            {isEditing && selectedNode && (
              <div className="absolute left-4 top-4 z-20 bg-white border rounded p-3 max-w-xs">
                <h4 className="font-medium mb-2 text-sm">Edit Node</h4>
                <div className="grid gap-2">
                  <div>
                    <label className="text-xs font-medium">Title:</label>
                    <input
                      type="text"
                      className="w-full p-1.5 text-sm border rounded mt-1"
                      value={selectedNode.node.name || selectedNode.node.title || ''}
                      onChange={(e) => updateNodeProperty('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Description:</label>
                    <textarea
                      className="w-full p-1.5 text-sm border rounded mt-1"
                      rows="2"
                      value={selectedNode.node.description || ''}
                      onChange={(e) => updateNodeProperty('description', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Button size="sm" variant="outline" onClick={addChildNode}>
                      <Plus className="h-3 w-3 mr-1" /> Add Child
                    </Button>
                    {selectedNode.path.length > 0 && (
                      <Button size="sm" variant="outline" className="text-red-500" onClick={deleteNode}>
                        <Trash className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MindMapItem;

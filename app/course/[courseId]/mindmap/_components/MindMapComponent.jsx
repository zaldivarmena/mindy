"use client"
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Download, Edit, Maximize, Minimize, Plus, Save, ZoomIn, ZoomOut } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';
import MindMapNode from './MindMapNode';
import NodeDetailsPanel from './NodeDetailsPanel';

// Custom node types
const nodeTypes = {
  mindMapNode: MindMapNode,
};

const MindMapComponent = React.forwardRef(({ data }, ref) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Process the mind map data from API to React Flow format
  useEffect(() => {
    if (!data) return;
    
    try {
      // Parse the data if it's a string
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Handle different possible data formats from AI
      let mindMapData = parsedData;
      
      // If the data is an array, take the first item (in case AI returns an array of mind maps)
      if (Array.isArray(parsedData)) {
        mindMapData = parsedData[0];
      }
      
      // If the data has a 'mindmap' property, use that
      if (parsedData.mindmap) {
        mindMapData = parsedData.mindmap;
      }
      
      // Extract nodes and connections
      const nodeData = mindMapData.nodes || [];
      const connectionData = mindMapData.connections || mindMapData.edges || [];
      
      // If no nodes are found but there's a different structure, try to adapt
      if (nodeData.length === 0) {
        // Create a basic structure if we have a topic or main concept
        if (mindMapData.topic || mindMapData.mainConcept || mindMapData.centralTopic) {
          const mainTopic = mindMapData.topic || mindMapData.mainConcept || mindMapData.centralTopic;
          
          // Create a central node
          const centralNode = {
            id: '1',
            label: mainTopic,
            type: 'main'
          };
          
          // Create child nodes from subtopics or concepts
          const childNodes = [];
          const edges = [];
          
          // Process subtopics if available
          const subtopics = mindMapData.subtopics || mindMapData.concepts || mindMapData.branches || [];
          
          subtopics.forEach((topic, index) => {
            const nodeId = (index + 2).toString();
            childNodes.push({
              id: nodeId,
              label: typeof topic === 'string' ? topic : topic.name || topic.label || `Subtopic ${index + 1}`,
              description: typeof topic === 'object' ? (topic.description || topic.details || '') : '',
              type: 'primary'
            });
            
            edges.push({
              source: '1',
              target: nodeId
            });
          });
          
          // Set nodes and edges
          const flowNodes = [centralNode, ...childNodes].map((node, index) => ({
            id: node.id,
            type: 'mindMapNode',
            position: { 
              x: index === 0 ? 400 : Math.cos(index * 0.5 * Math.PI) * 250 + 400, 
              y: index === 0 ? 300 : Math.sin(index * 0.5 * Math.PI) * 250 + 300 
            },
            data: { 
              label: node.label,
              description: node.description || '',
              type: node.type
            },
          }));
          
          const flowEdges = edges.map((edge) => ({
            id: `e${edge.source}-${edge.target}`,
            source: edge.source,
            target: edge.target,
            animated: false,
            style: { stroke: '#555' },
            type: 'smoothstep',
          }));
          
          setNodes(flowNodes);
          setEdges(flowEdges);
          return;
        }
      }
      
      // Determine node types and relationships for better positioning
      const nodeTypes = {};
      const childrenByParent = {};
      
      // First pass: identify node types and parent-child relationships
      connectionData.forEach(conn => {
        const sourceId = conn.source?.toString() || conn.from?.toString();
        const targetId = conn.target?.toString() || conn.to?.toString();
        
        if (!childrenByParent[sourceId]) {
          childrenByParent[sourceId] = [];
        }
        childrenByParent[sourceId].push(targetId);
      });
      
      // Find the root node (usually has most children and no parents)
      let rootId = '1';
      let maxChildren = 0;
      
      Object.keys(childrenByParent).forEach(parentId => {
        if (childrenByParent[parentId].length > maxChildren) {
          maxChildren = childrenByParent[parentId].length;
          rootId = parentId;
        }
      });
      
      // Assign node types based on hierarchy
      nodeData.forEach(node => {
        const id = node.id?.toString() || '1';
        if (id === rootId) {
          nodeTypes[id] = 'main';
        } else if (childrenByParent[rootId]?.includes(id)) {
          nodeTypes[id] = 'primary';
        } else {
          nodeTypes[id] = 'secondary';
        }
      });
      
      // Calculate better positions based on hierarchy
      const calculateNodePositions = () => {
        const centerX = window.innerWidth < 768 ? 150 : 400;
        const centerY = 300;
        const primaryRadius = window.innerWidth < 768 ? 150 : 250;
        const secondaryRadius = window.innerWidth < 768 ? 250 : 400;
        
        const positions = {};
        
        // Position the main node at center
        positions[rootId] = { x: centerX, y: centerY };
        
        // Position primary nodes in a circle around the main node
        const primaryNodes = childrenByParent[rootId] || [];
        primaryNodes.forEach((nodeId, index) => {
          const angle = (index * (2 * Math.PI / primaryNodes.length));
          positions[nodeId] = {
            x: centerX + Math.cos(angle) * primaryRadius,
            y: centerY + Math.sin(angle) * primaryRadius
          };
        });
        
        // Position secondary nodes around their primary parents
        primaryNodes.forEach((primaryId) => {
          const secondaryNodes = childrenByParent[primaryId] || [];
          const primaryPos = positions[primaryId];
          
          secondaryNodes.forEach((nodeId, index) => {
            const angle = (index * (2 * Math.PI / secondaryNodes.length));
            const offsetX = Math.cos(angle) * (secondaryRadius / 2);
            const offsetY = Math.sin(angle) * (secondaryRadius / 2);
            
            positions[nodeId] = {
              x: primaryPos.x + offsetX,
              y: primaryPos.y + offsetY
            };
          });
        });
        
        return positions;
      };
      
      const nodePositions = calculateNodePositions();
      
      // Transform nodes to React Flow format with improved positioning
      const flowNodes = nodeData.map((node, index) => {
        const id = node.id?.toString() || (index + 1).toString();
        const position = nodePositions[id] || { 
          x: node.position?.x || (index === 0 ? 400 : Math.cos(index * 0.5) * 250 + 400), 
          y: node.position?.y || (index === 0 ? 300 : Math.sin(index * 0.5) * 250 + 300) 
        };
        
        return {
          id: id,
          type: 'mindMapNode',
          position: position,
          data: { 
            label: node.label || node.content || node.text || node.name || `Node ${index + 1}`,
            description: node.description || node.details || node.info || '',
            type: node.type || nodeTypes[id] || (index === 0 ? 'main' : index < 5 ? 'primary' : 'secondary')
          },
        };
      });

      // Transform connections to React Flow edges
      const flowEdges = connectionData.map((connection, index) => ({
        id: connection.id || `e${index}`,
        source: connection.source?.toString() || connection.from?.toString(),
        target: connection.target?.toString() || connection.to?.toString(),
        animated: false,
        style: { stroke: '#555' },
        type: 'smoothstep',
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Error processing mind map data:", error);
      
      // Create a fallback mind map if there's an error
      const fallbackNodes = [
        {
          id: '1',
          type: 'mindMapNode',
          position: { x: 400, y: 300 },
          data: { label: 'Main Topic', type: 'main' }
        },
        {
          id: '2',
          type: 'mindMapNode',
          position: { x: 200, y: 150 },
          data: { label: 'Subtopic 1', type: 'primary' }
        },
        {
          id: '3',
          type: 'mindMapNode',
          position: { x: 600, y: 150 },
          data: { label: 'Subtopic 2', type: 'primary' }
        },
        {
          id: '4',
          type: 'mindMapNode',
          position: { x: 200, y: 450 },
          data: { label: 'Subtopic 3', type: 'primary' }
        },
        {
          id: '5',
          type: 'mindMapNode',
          position: { x: 600, y: 450 },
          data: { label: 'Subtopic 4', type: 'primary' }
        }
      ];
      
      const fallbackEdges = [
        { id: 'e1-2', source: '1', target: '2', type: 'smoothstep' },
        { id: 'e1-3', source: '1', target: '3', type: 'smoothstep' },
        { id: 'e1-4', source: '1', target: '4', type: 'smoothstep' },
        { id: 'e1-5', source: '1', target: '5', type: 'smoothstep' }
      ];
      
      setNodes(fallbackNodes);
      setEdges(fallbackEdges);
    }
  }, [data, setNodes, setEdges]);

  // Handle connecting nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  // Close node details panel
  const closeNodeDetails = () => {
    setSelectedNode(null);
  };

  // Toggle fullscreen
  const toggleFullScreen = () => {
    const element = document.documentElement;
    
    if (!isFullScreen) {
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    
    setIsFullScreen(!isFullScreen);
  };

  // Reference to the flow container for html-to-image
  const flowContainerRef = useRef(null);
  
  // State for node editing
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Export mind map as image using html-to-image
  const exportAsPng = useCallback(() => {
    try {
      if (!flowContainerRef.current) {
        toast.error("Unable to export mind map. Please try again.");
        return;
      }

      toast.info("Preparing your mind map image...");
      
      // First fit the view to ensure all nodes are visible
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
      
      // Wait a moment for the view to adjust
      setTimeout(() => {
        try {
          // Use html-to-image for better quality and compatibility
          htmlToImage.toPng(flowContainerRef.current, {
            quality: 1.0,
            backgroundColor: '#ffffff',
            pixelRatio: 2, // Higher resolution
            style: {
              border: 'none',
              borderRadius: '0',
            }
          })
          .then(dataUrl => {
            // Create a link and trigger download
            const a = document.createElement('a');
            a.setAttribute('download', 'mindmap.png');
            a.setAttribute('href', dataUrl);
            a.click();
            
            toast.success("Mind map saved as PNG!");
          })
          .catch(err => {
            console.error("Error generating PNG:", err);
            toast.error("Failed to save as PNG. Please try again.");
          });
        } catch (err) {
          console.error("Error in PNG export:", err);
          toast.error("Failed to save as PNG. Please try again.");
        }
      }, 500);
    } catch (err) {
      console.error("Error in exportAsPng:", err);
      toast.error("Unable to export mind map. Please try again.");
    }
  }, [reactFlowInstance]);
  
  // Handle node double click to edit
  const onNodeDoubleClick = useCallback((event, node) => {
    setNodeToEdit(node);
    setEditLabel(node.data.label);
    setEditDescription(node.data.description || '');
    setIsEditingNode(true);
  }, []);
  
  // Save node edits
  const saveNodeEdits = useCallback(() => {
    if (!nodeToEdit) return;
    
    setNodes(nds => 
      nds.map(node => {
        if (node.id === nodeToEdit.id) {
          // Update the node data
          return {
            ...node,
            data: {
              ...node.data,
              label: editLabel,
              description: editDescription
            }
          };
        }
        return node;
      })
    );
    
    setIsEditingNode(false);
    setNodeToEdit(null);
    toast.success("Node updated successfully!");
  }, [nodeToEdit, editLabel, editDescription, setNodes]);
  
  // Add a new node connected to the selected node
  const addChildNode = useCallback(() => {
    if (!selectedNode) {
      toast.error("Please select a parent node first");
      return;
    }
    
    // Generate a unique ID for the new node
    const newNodeId = `node_${Date.now()}`;
    
    // Determine the type based on the parent node's type
    let nodeType = 'secondary';
    if (selectedNode.data.type === 'secondary') {
      nodeType = 'tertiary';
    } else if (selectedNode.data.type === 'main') {
      nodeType = 'primary';
    }
    
    // Calculate position offset from parent
    const parentX = selectedNode.position.x;
    const parentY = selectedNode.position.y;
    const offset = 150;
    const angle = Math.random() * Math.PI * 2; // Random angle
    
    // Create the new node
    const newNode = {
      id: newNodeId,
      type: 'mindMapNode',
      position: {
        x: parentX + Math.cos(angle) * offset,
        y: parentY + Math.sin(angle) * offset
      },
      data: {
        label: 'New Node',
        description: 'Add description here',
        type: nodeType
      }
    };
    
    // Create the connection
    const newEdge = {
      id: `e${selectedNode.id}-${newNodeId}`,
      source: selectedNode.id,
      target: newNodeId,
      type: 'smoothstep'
    };
    
    // Update the state
    setNodes(nds => [...nds, newNode]);
    setEdges(eds => [...eds, newEdge]);
    
    // Select the new node for editing
    setNodeToEdit(newNode);
    setEditLabel('New Node');
    setEditDescription('Add description here');
    setIsEditingNode(true);
    
    toast.success("New node added! Edit its content now.");
  }, [selectedNode, setNodes, setEdges]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (!data) {
    return <div className="flex items-center justify-center h-full">No mind map data available</div>;
  }

  // Expose functions to the parent component via ref
  React.useImperativeHandle(ref, () => ({
    exportAsPng,
    addChildNode,
    saveNodeEdits
  }));

  return (
    <div className="h-full w-full border rounded-lg relative overflow-hidden">
      {isEditingNode && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white p-4 border-b shadow-md">
          <h3 className="font-medium mb-2">Edit Node</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Label</label>
              <input 
                type="text" 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea 
                value={editDescription} 
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-2 border rounded-md h-20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditingNode(false)}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={saveNodeEdits}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div ref={flowContainerRef} className="h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          defaultZoom={0.8}
          defaultEdgeOptions={{ type: 'smoothstep', animated: false }}
          attributionPosition="bottom-right"
          onInit={setReactFlowInstance}
          minZoom={0.1}
          maxZoom={2}
        >
        <Controls />
        <MiniMap 
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <Background variant="dots" gap={12} size={1} />
        
        <Panel position="top-right">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white hover:bg-blue-50"
              onClick={exportAsPng}
              title="Save as PNG"
            >
              <Download className="h-4 w-4 mr-1" />
              Save PNG
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white hover:bg-green-50"
              onClick={addChildNode}
              disabled={!selectedNode}
              title="Add child node"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Node
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white"
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </Panel>
        </ReactFlow>
      </div>
      
      {/* Node details panel */}
      {selectedNode && !isEditingNode && (
        <NodeDetailsPanel 
          node={selectedNode} 
          onClose={closeNodeDetails} 
          onEdit={() => {
            setNodeToEdit(selectedNode);
            setEditLabel(selectedNode.data.label);
            setEditDescription(selectedNode.data.description || '');
            setIsEditingNode(true);
          }}
        />
      )}
    </div>
  );
});

export default MindMapComponent;

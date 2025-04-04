"use client"
import React from 'react';
import { Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function NodeDetailsPanel({ node, onClose, onEdit, onDelete, editMode }) {
  if (!node) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg border-l p-4 z-10 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Node Details</h3>
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onEdit} 
            title="Edit node"
            disabled={!editMode}
            className={!editMode ? 'opacity-50 cursor-not-allowed' : ''}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {editMode && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                if (window.confirm(`Delete this node and all its children?`)) {
                  onDelete(node.id);
                }
              }} 
              title="Delete node and all children"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} title="Close panel">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-500">Title</h4>
          <p className="font-medium">{node.data.label}</p>
        </div>
        
        {node.data.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Description</h4>
            <p className="text-sm">{node.data.description}</p>
          </div>
        )}
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Type</h4>
          <p className="text-sm capitalize">{node.data.type || 'Default'}</p>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-500">Connections</h4>
          <p className="text-sm">ID: {node.id}</p>
        </div>
      </div>
    </div>
  );
}

export default NodeDetailsPanel;

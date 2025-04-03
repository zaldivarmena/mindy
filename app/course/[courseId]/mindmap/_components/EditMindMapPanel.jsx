"use client"
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';

function EditMindMapPanel({ data, courseId, onClose, onUpdate }) {
  const [content, setContent] = useState(JSON.stringify(data, null, 2));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate JSON format
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
      } catch (error) {
        toast.error("Invalid JSON format. Please check your input.");
        setIsSubmitting(false);
        return;
      }
      
      // Update the mind map content
      await axios.post('/api/update-study-type', {
        courseId: courseId,
        studyType: 'MindMap',
        content: parsedContent
      });
      
      toast.success("Mind map updated successfully!");
      onUpdate(parsedContent);
      onClose();
    } catch (error) {
      console.error("Error updating mind map:", error);
      toast.error("Failed to update mind map. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Edit Mind Map</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 flex-grow overflow-auto">
          <p className="text-sm text-gray-500 mb-2">
            Edit the JSON structure below to customize your mind map. Make sure to maintain valid JSON format.
          </p>
          <Textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            className="font-mono text-sm h-[60vh] resize-none"
          />
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditMindMapPanel;

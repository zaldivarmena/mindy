"use client"
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState, useRef } from 'react'
import { ArrowLeft, Download, Edit, Plus, RefreshCcw, Save } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MindMapComponent from './_components/MindMapComponent'
import EditMindMapPanel from './_components/EditMindMapPanel'
import { toast } from 'sonner'

function MindMap() {
  const { courseId } = useParams();
  const router = useRouter();
  const [mindMapData, setMindMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const mindMapComponentRef = useRef(null);

  useEffect(() => {
    getMindMapData();
  }, []);

  const getMindMapData = async () => {
    try {
      setLoading(true);
      const result = await axios.post('/api/study-type', {
        courseId: courseId,
        studyType: 'MindMap'
      });
      
      console.log("Mind map data from API:", result?.data);
      
      // Check if the content looks like quiz content instead of mind map content
      const content = result?.data?.content;
      if (content && Array.isArray(content) && content.length > 0 && content[0].question) {
        console.log("Detected quiz content instead of mind map content");
        // We need to regenerate the mind map with the correct type
        toast.error("Incorrect content type detected. Regenerating mind map...");
        await handleRefresh();
        return;
      }
      
      setMindMapData(result?.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching mind map data:", error);
      setLoading(false);
      toast.error("Failed to load mind map data");
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      toast.info("Regenerating mind map...");
      
      // Get course chapters for the prompt
      const courseResult = await axios.post('/api/course', {
        courseId: courseId
      });
      
      console.log("Course data:", courseResult?.data);
      
      let chapters = '';
      if (courseResult?.data?.courseLayout?.chapters) {
        courseResult.data.courseLayout.chapters.forEach(chapter => {
          const chapterTitle = chapter.chapter_title || chapter.chapterTitle || '';
          if (chapterTitle) {
            chapters = chapterTitle + ',' + chapters;
          }
        });
      } else {
        // Fallback if no chapters are found
        chapters = "General course content";
      }
      
      console.log("Chapters for mind map:", chapters);
      
      // Generate new mind map content with explicit MindMap type
      const contentResult = await axios.post('/api/study-type-content', {
        courseId: courseId,
        type: 'MindMap', // Explicitly use MindMap type
        chapters: chapters,
        courseLength: courseResult?.data?.courseLayout?.chapters?.length || 5
      });
      
      console.log("Content generation response:", contentResult?.data);
      
      // Wait a moment for the content to be generated by the Inngest function
      toast.info("Processing mind map data...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Fetch the updated data
      await getMindMapData();
      
      toast.success("Mind map regenerated successfully!");
    } catch (error) {
      console.error("Error refreshing mind map:", error);
      toast.error("Failed to regenerate mind map: " + (error.message || "Unknown error"));
    } finally {
      setRefreshing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
  };

  const handleUpdate = (updatedContent) => {
    setMindMapData(prev => ({
      ...prev,
      content: updatedContent
    }));
  };

  // Function to save mind map as PNG using html-to-image
  const handleSavePng = async () => {
    try {
      setSaving(true);
      toast.info("Preparing to save mind map as PNG...");
      
      if (mindMapComponentRef.current && mindMapComponentRef.current.exportAsPng) {
        await mindMapComponentRef.current.exportAsPng();
      } else {
        toast.error("Unable to save mind map. Please try again.");
      }
    } catch (error) {
      console.error("Error saving mind map as PNG:", error);
      toast.error("Failed to save mind map as PNG");
    } finally {
      setSaving(false);
    }
  };
  
  // Function to add a new node to the mind map
  const handleAddNode = () => {
    if (mindMapComponentRef.current && mindMapComponentRef.current.addChildNode) {
      mindMapComponentRef.current.addChildNode();
    } else {
      toast.error("Unable to add node. Please try again.");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className='font-bold text-2xl'>Mind Map</h2>
          <p>Visualize concepts and their relationships</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/course/${courseId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Course
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleAddNode}
            disabled={loading || !mindMapData}
            title="Add a new node to the mind map"
          >
            <Plus className="h-4 w-4" />
            Add Node
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="flex-grow">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p>Loading mind map...</p>
          </div>
        ) : mindMapData && Object.keys(mindMapData).length > 0 ? (
          <MindMapComponent 
            ref={mindMapComponentRef}
            data={mindMapData?.content} 
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="mb-4">No mind map data available. Generate one to get started.</p>
            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Generate Mind Map
            </Button>
          </div>
        )}
      </div>

      {isEditing && (
        <EditMindMapPanel 
          data={mindMapData?.content} 
          courseId={courseId}
          onClose={handleCloseEdit}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}

export default MindMap

"use client"
import React, { useEffect, useState } from 'react'
import MindMapItem from './_components/MindMapItem'
import { useParams } from 'next/navigation'
import axios from 'axios'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RefreshCw } from 'lucide-react'

function MindMapPage() {
    const { courseId } = useParams();
    const [mindMapData, setMindMapData] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [error, setError] = useState(null);
    const [generationId, setGenerationId] = useState(null);

    useEffect(() => {
        getMindMapData();
    }, [])
    
    // Poll for updates when mindmap is being generated
    useEffect(() => {
        let interval;
        if (isPolling && generationId) {
            interval = setInterval(async () => {
                try {
                    const result = await axios.post('/api/study-type', {
                        courseId: courseId,
                        studyType: 'MindMap'
                    });
                    
                    // Check the API response structure
                    if (result?.data) {
                        // API returns either the whole record object or an array
                        const statusCheck = result.data.status || 
                            (Array.isArray(result.data) && result.data.length > 0 ? result.data[0].status : null);
                        
                        const contentCheck = result.data.content || 
                            (Array.isArray(result.data) && result.data.length > 0 ? result.data[0].content : null);
                        
                        // If data is now available or status is no longer generating
                        if (contentCheck && statusCheck !== 'Generating') {
                            console.log('Mind map data ready:', contentCheck);
                            setMindMapData(contentCheck);
                            setIsPolling(false);
                            setIsGenerating(false);
                            clearInterval(interval);
                        }
                    }
                } catch (error) {
                    console.error("Error polling for mind map:", error);
                    setIsPolling(false);
                    setIsGenerating(false);
                    clearInterval(interval);
                }
            }, 3000); // Poll every 3 seconds
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isPolling, generationId, courseId]);

    const getMindMapData = async () => {
        try {
            const result = await axios.post('/api/study-type', {
                courseId: courseId,
                studyType: 'MindMap'
            });
            
            // Check if we received valid data
            if (result?.data) {
                if (result.data.status === 'Generating') {
                    // If the mind map is still being generated, start polling
                    setGenerationId(result.data.id);
                    setIsPolling(true);
                    setIsGenerating(true);
                } else {
                    // Data structure might be different based on the API response
                    // It could be either directly in data.content or nested in data
                    const contentData = result.data.content || result.data;
                    console.log('Mind map data received:', contentData);
                    setMindMapData(contentData);
                }
                setError(null);
            } else {
                // Empty or invalid response
                setMindMapData(null);
            }
        } catch (error) {
            console.error("Error fetching mind map data:", error);
            setError("Failed to load mind map data.");
        }
    }
    
    const generateMindMap = async () => {
        try {
            setIsGenerating(true);
            setError(null);
            
            // Get all notes to pass as content to study-type-content
            const notesResponse = await axios.post('/api/study-type', {
                courseId: courseId,
                studyType: 'notes'
            });
            
            if (!notesResponse.data || notesResponse.data.length === 0) {
                setError("No course content available to generate mind map");
                setIsGenerating(false);
                return;
            }
            
            // Combine notes content for the chapters parameter
            const chapters = notesResponse.data.map(note => note.notes).join("\n\n");
            
            // Use the standard study-type-content route, same as flashcards and quizzes
            const response = await axios.post('/api/study-type-content', {
                courseId: courseId,
                chapters: chapters,
                type: 'MindMap'
            });
            
            if (response.data) {
                // Set the generation ID and start polling for updates
                setGenerationId(response.data);
                setIsPolling(true);
            } else {
                setError("Failed to start mind map generation");
                setIsGenerating(false);
            }
        } catch (error) {
            console.error("Error generating mind map:", error);
            setError(error.response?.data?.error || "Failed to generate mind map");
            setIsGenerating(false);
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className='font-bold text-2xl'>Mind Map</h2>
                    <p className="text-gray-500">Visualize course concepts and their relationships!</p>
                </div>
                <Link href={`/course/${courseId}`}>
                    <Button variant="outline" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Course
                    </Button>
                </Link>
            </div>

            <div className="mt-8 h-full w-full relative">
                {isGenerating && (
                    <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
                        <div className="text-center">
                            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-primary mb-2" />
                            <p className="text-lg font-medium">Generating Mind Map...</p>
                            <p className="text-sm text-gray-500 mt-1">This may take a minute or two.</p>
                        </div>
                    </div>
                )}
                
                <MindMapItem mindMap={mindMapData} />
            </div>

            {!mindMapData && !isGenerating && (
                <div className="text-center py-10 space-y-4">
                    <p className="text-gray-500">No mind map content available for this course yet.</p>
                    <Button 
                        onClick={generateMindMap} 
                        disabled={isGenerating}
                        className="mx-auto"
                    >
                        Generate Mind Map
                    </Button>
                </div>
            )}

            {error && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
                    {error}
                    {!isGenerating && (
                        <Button 
                            onClick={generateMindMap} 
                            variant="outline" 
                            size="sm" 
                            className="mt-2">
                            Try Again
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default MindMapPage

import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    const {chapters,courseId,type,courseLength}=await req.json();

    let PROMPT;
    
    if (type === 'Flashcard') {
        PROMPT = `Generate concise flashcards on the topic: ${chapters} in JSON format. Each flashcard should have:

1. A 'front' field with a relevant emoji + a brief, clear question (max 15 words)
2. A 'back' field with a concise answer (max 50 words) that captures the essential information

Choose emojis that relate to each card's content (e.g., 💰 for finance, 📊 for statistics).

Focus on key concepts and definitions. Avoid lengthy explanations while ensuring accuracy. Generate a maximum of ${courseLength * 3} flashcards. Return as a valid JSON array of objects.`;
    } else if (type === 'MindMap') {
        PROMPT = `Generate a comprehensive hierarchical mind map on topic: ${chapters}. 

The mind map should have:
1. A central main topic node at the top (root node)
2. Multiple primary branches (at least 5-7 main concepts) vertically aligned below the root node
3. Secondary branches from each primary branch (2-3 subtopics per main concept) continuing downward
4. Tertiary branches where appropriate (deeper details) at the bottom levels

The structure should follow a vertical tree distribution with the root node at the top and all branches flowing downward in a hierarchical manner. This vertical alignment is critical for proper visualization.

Each node should have a concise label and a brief description explaining the concept.

Return in JSON format with the following structure: 
{
  "nodes": [
    {
      "id": "1", 
      "label": "Main Topic",
      "type": "main",
      "description": "Detailed description of the main topic",
      "level": 0  // Root level
    },
    {
      "id": "2",
      "label": "Primary Branch 1",
      "type": "primary",
      "description": "Description of this main concept",
      "level": 1  // First level below root
    },
    {
      "id": "3",
      "label": "Secondary Branch 1.1",
      "type": "secondary",
      "description": "More detailed information about this subtopic",
      "level": 2  // Second level
    },
    {
      "id": "4",
      "label": "Tertiary Branch 1.1.1",
      "type": "tertiary",
      "description": "Specific details about this concept",
      "level": 3  // Third level
    }
  ],
  "connections": [
    {
      "source": "1",
      "target": "2",
      "direction": "down"  // Explicitly indicate vertical flow
    },
    {
      "source": "2",
      "target": "3",
      "direction": "down"
    },
    {
      "source": "3",
      "target": "4",
      "direction": "down"
    }
  ]
}

Ensure all nodes have unique IDs and that connections properly represent the hierarchical relationship between concepts. The vertical tree structure is essential - all nodes at the same level should be horizontally aligned, and each level should be clearly below its parent level.`;
    } else {
        PROMPT = 'Generate Quiz on topic : '+chapters+' with Question and Options along with correct answer in JSON format. (max '+courseLength*3+' or 15 questions)';
    }

    //Insert Record to DB , Update status to Generating...
    const result=await db.insert(STUDY_TYPE_CONTENT_TABLE).values({
        courseId:courseId,
        type:type
    }).returning({id:STUDY_TYPE_CONTENT_TABLE.id});


    //Trigger Inngest Function
  const result_=  await inngest.send({
        name:'studyType.content',
        data:{
           studyType:type, 
           prompt:PROMPT,
           courseId:courseId,
           recordId:result[0].id 
        }
    })

    return NextResponse.json(result[0].id )

}
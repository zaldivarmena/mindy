import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    const {chapters,courseId,type,courseLength}=await req.json();

    let PROMPT;
    
    if (type === 'Flashcard') {
        PROMPT = 'Generate the flashcard on topic : ' + chapters + ' in JSON format with front back content, Maximum ('+courseLength +' * 3) flashcards';
    } else if (type === 'MindMap') {
        PROMPT = `Generate a comprehensive hierarchical mind map on topic: ${chapters}. 

The mind map should have:
1. A central main topic node
2. Multiple primary branches (at least 5-7 main concepts)
3. Secondary branches from each primary branch (2-3 subtopics per main concept)
4. Tertiary branches where appropriate (deeper details)

Each node should have a concise label and a brief description explaining the concept.

Return in JSON format with the following structure: 
{
  "nodes": [
    {
      "id": "1", 
      "label": "Main Topic",
      "type": "main",
      "description": "Detailed description of the main topic"
    },
    {
      "id": "2",
      "label": "Primary Branch 1",
      "type": "primary",
      "description": "Description of this main concept"
    },
    {
      "id": "3",
      "label": "Secondary Branch 1.1",
      "type": "secondary",
      "description": "More detailed information about this subtopic"
    },
    {
      "id": "4",
      "label": "Tertiary Branch 1.1.1",
      "type": "tertiary",
      "description": "Specific details about this concept"
    }
  ],
  "connections": [
    {
      "source": "1",
      "target": "2"
    },
    {
      "source": "2",
      "target": "3"
    },
    {
      "source": "3",
      "target": "4"
    }
  ]
}

Ensure all nodes have unique IDs and that connections properly represent the hierarchical relationship between concepts.`;
    } else {
        PROMPT = 'Generate Quiz on topic : ' + chapters + ' with Question and Options along with correct answer in JSON format, (Max '+courseLength +' * 3)';
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
import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    const {chapters,courseId,type,courseLength}=await req.json();

  const PROMPT = type === 'Flashcard' 
      ? 'Generate the flashcard on topic : '+chapters+' in JSON format with front back content, Maximum '+courseLength+' multiplied by 3'
      : type === 'Quiz'
          ? 'Generate Quiz on topic : '+chapters+' with Question and Options along with correct answer in JSON format, (Max '+courseLength+' multiplied by 3)'
          : 'Generate MindMap on topic : '+chapters+' with Topic and Subtopics in JSON format, (Max '+courseLength+' multiplied by 3)';

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
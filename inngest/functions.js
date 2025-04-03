import { db } from "@/configs/db";
import { inngest } from "./client";
import { CHAPTER_NOTES_TABLE, STUDY_MATERIAL_TABLE, STUDY_TYPE_CONTENT_TABLE, USER_TABLE } from "@/configs/schema";
import { eq } from "drizzle-orm";
import { courseOutlineAIModel, generateNotesAiModel, GenerateQuizAiModel, GenerateStudyTypeContentAiModel } from "@/configs/AiModel";

export const helloWorld = inngest.createFunction(
    { id: "hello-world" },
    { event: "test/hello.world" },
    async ({ event, step }) => {
        await step.sleep("wait-a-moment", "1s");
        return { event, body: "Hello, World!" };
    },
);

export const CreateNewUser = inngest.createFunction(
    { id: 'create-user',retries:1 },
    { event: 'user.create' },
    async ({ event, step }) => {
        const {user}=event.data;
        // Get Event Data
        const result = await step.run('Check User and create New if Not in DB', async () => {
            // Check Is User Already Exist
            const result = await db.select().from(USER_TABLE)
                .where(eq(USER_TABLE.email, user?.primaryEmailAddress?.emailAddress))

            if (result?.length == 0) {
                //If Not, Then add to DB
                const userResp = await db.insert(USER_TABLE).values({
                    name: user?.fullName,
                    email: user?.primaryEmailAddress?.emailAddress
                }).returning({ USER_TABLE })
                return userResp;
            }

            return result;
        })

        return 'Success';
    }

    // Step is to Send Welecome Email notification

    // Step to Send Email notification After 3 Days Once user join it
)

export const GenerateNotes=inngest.createFunction(
    {id:'generate-course',retries:1},
    {event:'notes.generate'},
    async({event,step})=>{
        const {course}=event.data; // All Record Info

        // Generate Notes for Each Chapter with AI
        const notesResult=await step.run('Generate Chapter Notes',async()=>{
            const Chapters=course?.courseLayout?.chapters;
            let index=0;
            // Chapters.forEach(async(chapter)=>{
                for (const chapter of Chapters) {// Used for loop to make async Call and wait to complete execution
                const PROMPT='Generate '+course?.courseType+' material detail content for each chapter , Make sure to give notes for each topics from chapters, Code example if applicable in <precode> tag also markHeight the key points and add style for each tags and give the response in HTML format (Do not Add HTML , Head, Body, title tag), The chapter content is :'+ JSON.stringify(chapter)+" ";
                const result=await generateNotesAiModel.sendMessage(PROMPT);
                const aiResp=result.response.text();
                    console.log(PROMPT)
                await db.insert(CHAPTER_NOTES_TABLE).values({
                    chapterId:index,
                    courseId:course?.courseId,
                    notes:aiResp
                })
                index=index+1;

            // })
                }
            return Chapters;
        })

        // Update Status to 'Ready'
        const updateCourseStatusResult=await step.run('Update Course Status to Ready',async()=>{
            const result=await db.update(STUDY_MATERIAL_TABLE).set({
                status:'Ready'
            }) .where(eq(STUDY_MATERIAL_TABLE.courseId,course?.courseId))
            return 'Success';
        });

    }
)

// Function to generate study type content (Flashcards, MindMap, Quiz)
export const GenerateStudyTypeContent = inngest.createFunction(
    { id: 'generate-study-type-content', retries: 1 },
    { event: 'studyType.content' },
    async ({ event, step }) => {
        const { studyType, prompt, courseId, recordId } = event.data;

        // Generate content using AI
        const contentResult = await step.run('Generate Content with AI', async () => {
            console.log(`Generating ${studyType} content with prompt: ${prompt}`);
            
            // Use the AI model to generate content
            const result = await GenerateStudyTypeContentAiModel.sendMessage(prompt);
            const aiResp = result.response.text();
            
            console.log(`AI response for ${studyType}:`, aiResp);
            
            // Parse the AI response as JSON
            let content;
            try {
                // Try to parse the response as JSON
                // Remove any markdown code blocks if present
                const cleanedResponse = aiResp.replace(/```json\n|```\n|```json|```/g, '');
                content = JSON.parse(cleanedResponse);
                
                // For MindMap, ensure it has the expected structure
                if (studyType === 'MindMap') {
                    // If the content is missing nodes or connections, add default ones
                    if (!content.nodes || !Array.isArray(content.nodes) || content.nodes.length === 0) {
                        content = {
                            nodes: [
                                {
                                    id: "1",
                                    label: "Main Topic",
                                    type: "main"
                                },
                                {
                                    id: "2",
                                    label: "Subtopic 1",
                                    type: "primary"
                                }
                            ],
                            connections: [
                                {
                                    source: "1",
                                    target: "2"
                                }
                            ]
                        };
                    }
                }
            } catch (error) {
                console.error('Error parsing AI response as JSON:', error);
                // If parsing fails, create a default structure based on study type
                if (studyType === 'MindMap') {
                    content = {
                        nodes: [
                            {
                                id: "1",
                                label: "Main Topic",
                                type: "main"
                            },
                            {
                                id: "2",
                                label: "Subtopic 1",
                                type: "primary"
                            }
                        ],
                        connections: [
                            {
                                source: "1",
                                target: "2"
                            }
                        ]
                    };
                } else {
                    // Generic fallback for other study types
                    content = { 
                        error: "Failed to parse AI response",
                        rawContent: aiResp 
                    };
                }
            }
            
            return content;
        });

        // Update the record in the database
        const updateResult = await step.run('Update Study Type Content', async () => {
            const result = await db.update(STUDY_TYPE_CONTENT_TABLE)
                .set({
                    content: JSON.stringify(contentResult),
                    status: 'Ready'
                })
                .where(eq(STUDY_TYPE_CONTENT_TABLE.id, recordId));
            
            return 'Success';
        });

        return { success: true, studyType, courseId };
    }
);


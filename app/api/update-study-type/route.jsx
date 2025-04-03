import { db } from "@/configs/db";
import { STUDY_TYPE_CONTENT_TABLE } from "@/configs/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { courseId, studyType, content } = await req.json();

        // Update the study type content in the database
        const result = await db.update(STUDY_TYPE_CONTENT_TABLE)
            .set({
                content: JSON.stringify(content)
            })
            .where(
                and(
                    eq(STUDY_TYPE_CONTENT_TABLE.courseId, courseId),
                    eq(STUDY_TYPE_CONTENT_TABLE.type, studyType)
                )
            )
            .returning({ id: STUDY_TYPE_CONTENT_TABLE.id });

        if (!result || result.length === 0) {
            return NextResponse.json({ error: "Failed to update content" }, { status: 400 });
        }

        return NextResponse.json({ success: true, id: result[0].id });
    } catch (error) {
        console.error("Error updating study type content:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

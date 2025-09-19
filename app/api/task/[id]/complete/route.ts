// app/api/tasks/[id]/complete/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as taskService from "@/lib/services/taskService";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const completedTask = await taskService.completeTask(params.id, user);
    return NextResponse.json(completedTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
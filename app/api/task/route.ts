// app/api/tasks/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as taskService from "@/lib/services/taskService";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const tasks = await taskService.getTasks(user);
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (user.profile.role !== 'admin') {
        throw new Error("Apenas administradores podem criar tarefas.");
    }
    const body = await req.json();
    const newTask = await taskService.createTask(body, user);
    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message.includes("administradores") ? 403 : 500 });
  }
}
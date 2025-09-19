// app/api/events/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as eventService from "@/lib/services/eventService";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const events = await eventService.getEvents(user);
    return NextResponse.json(events);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const newEvent = await eventService.createEvent(body, user);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
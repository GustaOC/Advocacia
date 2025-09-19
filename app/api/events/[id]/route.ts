// app/api/events/[id]/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as eventService from "@/lib/services/eventService";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const user = await requireAuth();
        const body = await req.json();
        const updatedEvent = await eventService.updateEvent(params.id, body, user);
        return NextResponse.json(updatedEvent);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
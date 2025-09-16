// Para app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("[notifications/GET] Starting request")

    // Emergency mode para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log("[notifications/GET] Development mode - returning mock data")
      return NextResponse.json({ 
        notifications: [],
        count: 0,
        success: true,
        message: "Running in development mode"
      })
    }

    // Código original aqui...
    
  } catch (error: any) {
    console.error("[notifications/GET] Error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}

// Para app/api/notifications/count/route.ts
export async function GET(request: NextRequest) {
  try {
    console.log("[notifications/count/GET] Starting request")

    if (process.env.NODE_ENV === 'development') {
      console.log("[notifications/count/GET] Development mode - returning 0")
      return NextResponse.json({ 
        count: 0,
        success: true
      })
    }

    // Código original aqui...
    
  } catch (error: any) {
    console.error("[notifications/count/GET] Error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}

// Para app/api/petitions/route.ts
export async function GET(request: NextRequest) {
  try {
    console.log("[petitions/GET] Starting request")

    if (process.env.NODE_ENV === 'development') {
      console.log("[petitions/GET] Development mode - returning mock data")
      return NextResponse.json({ 
        petitions: [],
        success: true,
        message: "Running in development mode"
      })
    }

    // Código original aqui...
    
  } catch (error: any) {
    console.error("[petitions/GET] Error:", error)
    return NextResponse.json({ error: error.message, success: false }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const DEFAULT_EMAIL = "admin@slowlog.dev"

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) return NextResponse.json({ needsUpdate: false })
  const needsUpdate = session.user.email.toLowerCase() === DEFAULT_EMAIL
  return NextResponse.json({ needsUpdate })
}

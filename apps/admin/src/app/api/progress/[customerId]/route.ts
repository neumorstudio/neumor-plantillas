import { NextResponse } from "next/server";
import { getClientProgress } from "@/lib/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  try {
    const progress = await getClientProgress(customerId);
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: "Error loading progress" }, { status: 500 });
  }
}

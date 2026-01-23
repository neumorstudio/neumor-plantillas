import { NextResponse } from "next/server";
import { getClientRecords } from "@/lib/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  try {
    const records = await getClientRecords(customerId);
    return NextResponse.json(records);
  } catch {
    return NextResponse.json({ error: "Error loading records" }, { status: 500 });
  }
}

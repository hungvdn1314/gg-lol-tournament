import { NextResponse } from "next/server";

export async function GET() {
  return new NextResponse("a4bc34ea-246a-4621-b38e-06622c4afc5b", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

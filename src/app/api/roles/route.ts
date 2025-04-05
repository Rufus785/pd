import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany();

    return NextResponse.json(
      { roles: roles.map((role) => role.name) },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

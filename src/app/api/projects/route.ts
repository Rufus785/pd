import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      projects.map((project) => ({
        id: project.id,
        name: project.name,
        status: project.status,
        payment_status: project.payment_status,
      }))
    );
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Błąd pobierania projektów" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        users: {
          include: {
            user: true,
          },
        },
      },
    });

    const transformedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      users: role.users.map((ru) => ru.user),
    }));

    return NextResponse.json({ roles: transformedRoles }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const role = await prisma.role.create({
      data: {
        name: body.name,
      },
    });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Failed to create role:", error);
    return NextResponse.json(
      { error: "Failed to create role" },
      { status: 500 }
    );
  }
}

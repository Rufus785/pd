import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        password_changed: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        nickname: "asc",
      },
    });

    const formattedUsers = users.map((user) => ({
      id: user.id,
      nickname: user.nickname,
      roles: user.roles.map((r) => r.role.name),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania użytkowników" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const searchQuery = new URL(request.url).searchParams.get("search") || "";
    const users = await prisma.user.findMany({
      where: { nickname: { contains: searchQuery } },
      include: {
        roles: { include: { role: true } },
        tasks: true,
        teams: { include: { team: true } },
      },
      orderBy: { nickname: "asc" },
    });

    return NextResponse.json(
      users.map((user) => ({
        id: user.id,
        nickname: user.nickname,
        password_changed: user.password_changed,
        roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
        tasks: user.tasks.map(({ id, title, status, priority }) => ({
          id,
          title,
          status,
          priority,
        })),
        teams: user.teams.map(({ team, role }) => ({
          id: team.id,
          name: team.team_name,
          role,
          project_id: team.project_id,
        })),
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Błąd pobierania użytkowników" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const {
      nickname,
      password_hash,
      password_changed = false,
      roles = [],
    } = await request.json();
    if (!nickname || !password_hash)
      return NextResponse.json(
        { error: "Nazwa i hasło wymagane" },
        { status: 400 }
      );

    if (await prisma.user.findUnique({ where: { nickname } })) {
      return NextResponse.json(
        { error: "Użytkownik już istnieje" },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: { nickname, password_hash, password_changed },
    });

    if (roles.length) {
      const roleIds = (
        await prisma.role.findMany({ where: { name: { in: roles } } })
      ).map(({ id }) => id);
      await prisma.roleUser.createMany({
        data: roleIds.map((id_role) => ({ id_user: user.id, id_role })),
      });
    }

    return GET(request);
  } catch {
    return NextResponse.json(
      { error: "Błąd tworzenia użytkownika" },
      { status: 500 }
    );
  }
}

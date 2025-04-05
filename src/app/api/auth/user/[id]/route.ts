import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { hash } from "bcrypt";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Nieprawidłowy ID użytkownika" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { include: { role: true } },
      tasks: true,
      teams: { include: { team: true } },
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Użytkownik nie został znaleziony" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...user,
    roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
    teams: user.teams.map((t) => ({
      id: t.team.id,
      name: t.team.team_name,
      role: t.role,
      project_id: t.team.project_id,
    })),
    tasks: user.tasks,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Nieprawidłowy ID użytkownika" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json(
      { error: "Użytkownik nie został znaleziony" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const updateData: any = {};

  if (body.nickname !== undefined) updateData.nickname = body.nickname;
  if (body.password !== undefined) {
    updateData.password_hash = await hash(body.password, 10);
    updateData.password_changed = true;
  }
  if (body.password_changed !== undefined)
    updateData.password_changed = body.password_changed;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: updateData });
    if (body.roles) {
      await tx.roleUser.deleteMany({ where: { id_user: id } });
      const roles = await tx.role.findMany({
        where: { name: { in: body.roles } },
      });
      await tx.roleUser.createMany({
        data: roles.map((role) => ({ id_user: id, id_role: role.id })),
      });
    }
  });

  return GET(request, { params });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Nieprawidłowy ID użytkownika" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findUnique({ where: { id } });
  if (!existingUser) {
    return NextResponse.json(
      { error: "Użytkownik nie został znaleziony" },
      { status: 404 }
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.roleUser.deleteMany({ where: { id_user: id } });
    await tx.userTeam.deleteMany({ where: { user_id: id } });
    await tx.task.deleteMany({ where: { user_id: id } });
    await tx.user.delete({ where: { id } });
  });

  return NextResponse.json({ message: "Użytkownik został pomyślnie usunięty" });
}

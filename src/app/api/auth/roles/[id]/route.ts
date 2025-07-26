import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

function getIdFromUrl(request: Request) {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/");
  return segments[segments.length - 1];
}

export async function GET(request: Request) {
  try {
    const id = Number.parseInt(getIdFromUrl(request));
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID roli" },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          include: { user: true },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rola nie została znaleziona" },
        { status: 404 }
      );
    }

    const transformedRole = {
      id: role.id,
      name: role.name,
      users: role.users.map((ru) => ru.user),
    };

    return NextResponse.json(transformedRole);
  } catch (error) {
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania danych roli" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const id = Number.parseInt(getIdFromUrl(request));
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID roli" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    const role = await prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({ where: { id } });
      if (!existingRole) throw new Error("NOT_FOUND");

      await tx.role.update({ where: { id }, data: updateData });

      return tx.role.findUnique({
        where: { id },
        include: {
          users: {
            include: { user: true },
          },
        },
      });
    });

    if (!role) {
      return NextResponse.json(
        { error: "Rola nie została znaleziona" },
        { status: 404 }
      );
    }

    const transformedRole = {
      id: role.id,
      name: role.name,
      users: role.users.map((ru) => ru.user),
    };

    return NextResponse.json(transformedRole);
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Rola nie została znaleziona" },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Rola o podanej nazwie już istnieje" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji roli" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number.parseInt(getIdFromUrl(request));
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID roli" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const existingRole = await tx.role.findUnique({ where: { id } });
      if (!existingRole) throw new Error("NOT_FOUND");

      await tx.roleUser.deleteMany({ where: { id_role: id } });
      await tx.role.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Rola została pomyślnie usunięta" });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Rola nie została znaleziona" },
        { status: 404 }
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        { error: "Nie można usunąć roli, ponieważ istnieją powiązane rekordy" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania roli" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID projektu" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        meetings: true,
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Projekt nie został znaleziony" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      { error: "Wystąpił błąd podczas pobierania danych projektu" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID projektu" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projekt nie został znaleziony" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.payment_status !== undefined)
      updateData.payment_status = body.payment_status;
    if (body.wireframe_link !== undefined)
      updateData.wireframe_link = body.wireframe_link;
    if (body.subscription_end !== undefined) {
      updateData.subscription_end = body.subscription_end
        ? new Date(body.subscription_end)
        : null;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        meetings: true,
        teams: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                  },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Projekt zaktualizowany pomyślnie",
      project: updatedProject,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Projekt o podanej nazwie już istnieje" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Wystąpił błąd podczas aktualizacji projektu" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number.parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Nieprawidłowy ID projektu" },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Projekt nie został znaleziony" },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.meeting.deleteMany({
        where: { project_id: id },
      });

      await tx.task.deleteMany({
        where: { project_id: id },
      });

      const teams = await tx.team.findMany({
        where: { project_id: id },
        select: { id: true },
      });

      for (const team of teams) {
        await tx.userTeam.deleteMany({
          where: { team_id: team.id },
        });
      }

      await tx.team.deleteMany({
        where: { project_id: id },
      });

      await tx.project.delete({
        where: { id },
      });
    });

    return NextResponse.json({
      message: "Projekt został pomyślnie usunięty",
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            error:
              "Nie można usunąć projektu, ponieważ istnieją powiązane rekordy",
          },
          { status: 400 }
        );
      } else if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Projekt nie został znaleziony" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Wystąpił błąd podczas usuwania projektu" },
      { status: 500 }
    );
  }
}

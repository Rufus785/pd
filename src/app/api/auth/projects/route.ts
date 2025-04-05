import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const {
      name,
      status = "Active",
      wireframe_link,
      payment_status = "Unpaid",
      subscription_end,
      meetings = [],
      teams = [],
    } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Nazwa projektu jest wymagana" },
        { status: 400 }
      );
    }

    const existingProject = await prisma.project.findFirst({
      where: { name },
    });

    if (existingProject) {
      return NextResponse.json(
        { error: "Projekt o tej nazwie już istnieje" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        status,
        payment_status,
        wireframe_link,
        subscription_end: subscription_end ? new Date(subscription_end) : null,

        meetings: {
          create: meetings.map((meeting: any) => ({
            meeting_date: new Date(meeting.meeting_date),
            description: meeting.description,
          })),
        },

        teams: {
          create: teams.map((team: any) => ({
            team_name: team.team_name,
            members: team.members
              ? {
                  create: team.members.map((member: any) => ({
                    user_id: member.user_id,
                    role: member.role,
                  })),
                }
              : undefined,
          })),
        },
      },
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
      },
    });

    return NextResponse.json(
      {
        message: "Projekt utworzony pomyślnie",
        project,
      },
      { status: 201 }
    );
  } catch (error) {
    if ((error as any).code === "P2002") {
      return NextResponse.json(
        { error: "Projekt o tej nazwie już istnieje" },
        { status: 400 }
      );
    }

    if ((error as any).code === "P2003") {
      return NextResponse.json(
        { error: "Odwołanie do nieistniejącego zasobu" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Błąd podczas tworzenia projektu" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
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

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json(
      { error: "Błąd podczas pobierania projektów" },
      { status: 500 }
    );
  }
}

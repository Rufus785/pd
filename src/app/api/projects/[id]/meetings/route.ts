import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Number(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const userTeam = await prisma.userTeam.findFirst({
      where: {
        user_id: Number(session.user.id),
        team: {
          project_id: projectId,
        },
      },
    });

    const isAdmin = session.user.roles?.includes("Admin");

    if (!userTeam && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    const meetings = await prisma.meeting.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: {
        meeting_date: "desc",
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return NextResponse.json(
      { error: "Failed to fetch meetings" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Number(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const userRoles = session.user.roles || [];
    const isPMorAdmin = userRoles.includes("PM") || userRoles.includes("Admin");

    if (!isPMorAdmin) {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          user_id: Number(session.user.id),
          team: {
            project_id: projectId,
          },
          role: "PM",
        },
      });

      if (!userTeam) {
        return NextResponse.json(
          { error: "Only Project Managers can create meetings" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    // Validate required fields
    if (!data.meeting_date) {
      return NextResponse.json(
        { error: "Meeting date is required" },
        { status: 400 }
      );
    }

    // Create meeting
    const newMeeting = await prisma.meeting.create({
      data: {
        project_id: projectId,
        meeting_date: new Date(data.meeting_date),
        description: data.description || null,
      },
    });

    return NextResponse.json(newMeeting, { status: 201 });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return NextResponse.json(
      { error: "Failed to create meeting" },
      { status: 500 }
    );
  }
}

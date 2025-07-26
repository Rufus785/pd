import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function getProjectIdFromUrl(req: Request) {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split("/");
  return segments[3];
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Number(getProjectIdFromUrl(req));
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

    const tasks = await prisma.task.findMany({
      where: {
        project_id: projectId,
      },
      orderBy: [{ priority: "asc" }, { status: "asc" }],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = Number(getProjectIdFromUrl(req));
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
          { error: "Only Project Managers can create tasks" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    if (!data.title || !data.priority || !data.status || !data.user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newTask = await prisma.task.create({
      data: {
        project_id: projectId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        user_id: data.user_id,
      },
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

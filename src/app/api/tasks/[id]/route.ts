import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function getTaskIdFromUrl(req: Request) {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split("/");
  return segments[3];
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = Number(getTaskIdFromUrl(req));
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            teams: {
              include: {
                members: {
                  where: {
                    user_id: Number(session.user.id),
                    role: "PM",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userRoles = session.user.roles || [];
    const isPMorAdmin = userRoles.includes("PM") || userRoles.includes("Admin");
    const isProjectPM = task.project.teams.some(
      (team) => team.members.length > 0
    );

    if (!isPMorAdmin && !isProjectPM) {
      return NextResponse.json(
        { error: "Only Project Managers can update tasks" },
        { status: 403 }
      );
    }

    const data = await req.json();

    if (!data.title || !data.priority || !data.status || !data.user_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: data.status,
        user_id: data.user_id,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = Number(getTaskIdFromUrl(req));
    if (isNaN(taskId)) {
      return NextResponse.json({ error: "Invalid task ID" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            teams: {
              include: {
                members: {
                  where: {
                    user_id: Number(session.user.id),
                    role: "PM",
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const userRoles = session.user.roles || [];
    const isPMorAdmin = userRoles.includes("PM") || userRoles.includes("Admin");
    const isProjectPM = task.project.teams.some(
      (team) => team.members.length > 0
    );

    if (!isPMorAdmin && !isProjectPM) {
      return NextResponse.json(
        { error: "Only Project Managers can delete tasks" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

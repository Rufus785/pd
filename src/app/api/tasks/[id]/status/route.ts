import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function getTaskIdFromUrl(req: Request) {
  const pathname = new URL(req.url).pathname;
  const segments = pathname.split("/");
  return segments[3];
}

export async function PATCH(req: Request) {
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

    const hasAccess = task.project.teams.some(
      (team) => team.members.length > 0
    );
    const isAdmin = session.user.roles?.includes("Admin");

    if (!hasAccess && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have access to this task" },
        { status: 403 }
      );
    }

    const data = await req.json();

    if (
      !data.status ||
      !["ToDo", "InProgress", "CodeReview", "Deprecated", "Done"].includes(
        data.status
      )
    ) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: data.status,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json(
      { error: "Failed to update task status" },
      { status: 500 }
    );
  }
}

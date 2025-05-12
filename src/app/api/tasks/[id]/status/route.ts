import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const taskId = Number(params.id);
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
        { error: "Only Project Managers can update task status" },
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

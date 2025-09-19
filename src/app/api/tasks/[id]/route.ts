// src/app/api/tasks/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// PUT /api/tasks/:id — edycja (z walidacją assignee w ramach projektu)
export async function PUT(req: Request, ctx: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = ctx?.params ?? {};
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
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
                  where: { user_id: Number(session.user.id), role: "PM" },
                },
              },
            },
          },
        },
      },
    });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const roles = session.user.roles || [];
    const isPMorAdmin = roles.includes("PM") || roles.includes("Admin");
    const isProjectPM = task.project.teams.some((t) => t.members.length > 0);
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

    // Walidacja: user musi należeć do teamu przypisanego do TEGO projektu
    const assigneeCount = await prisma.team.count({
      where: {
        project_id: task.project_id,
        members: { some: { user_id: Number(data.user_id) } },
      },
    });
    if (assigneeCount === 0) {
      return NextResponse.json(
        { error: "Assignee must belong to a team assigned to this project" },
        { status: 400 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description ?? null,
        priority: data.priority,
        status: data.status,
        user_id: data.user_id,
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/:id
export async function DELETE(_req: Request, ctx: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = ctx?.params ?? {};
    const taskId = Number(id);
    if (!Number.isFinite(taskId)) {
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
                  where: { user_id: Number(session.user.id), role: "PM" },
                },
              },
            },
          },
        },
      },
    });
    if (!task)
      return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const roles = session.user.roles || [];
    const isPMorAdmin = roles.includes("PM") || roles.includes("Admin");
    const isProjectPM = task.project.teams.some((t) => t.members.length > 0);
    if (!isPMorAdmin && !isProjectPM) {
      return NextResponse.json(
        { error: "Only Project Managers can delete tasks" },
        { status: 403 }
      );
    }

    await prisma.task.delete({ where: { id: taskId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}

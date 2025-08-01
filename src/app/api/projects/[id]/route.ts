import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

enum ProjectStatus {
  Active = "Active",
  Archived = "Archived",
  Closed = "Closed",
}

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

    let project = await prisma.project.findUnique({
      where: { id: projectId },
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
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const hasAccess = project.teams.some(
      (team: { members: any[] }) => team.members.length > 0
    );
    const isAdmin = session.user.roles?.includes("Admin");

    if (!hasAccess && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    if (
      project.status === ProjectStatus.Active &&
      project.subscription_end &&
      new Date(project.subscription_end) < new Date()
    ) {
      project = await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.Archived },
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
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

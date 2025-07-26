import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

function getProjectIdFromUrl(req: Request) {
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
          { error: "Only Project Managers can update project status" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    if (
      !data.status ||
      !["Active", "Archived", "Closed"].includes(data.status)
    ) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: data.status,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project status:", error);
    return NextResponse.json(
      { error: "Failed to update project status" },
      { status: 500 }
    );
  }
}

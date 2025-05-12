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

    const projectId = Number(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const userRoles = session.user.roles || [];
    const isDesignerPMorAdmin =
      userRoles.includes("Designer") ||
      userRoles.includes("PM") ||
      userRoles.includes("Admin");

    if (!isDesignerPMorAdmin) {
      const userTeam = await prisma.userTeam.findFirst({
        where: {
          user_id: Number(session.user.id),
          team: {
            project_id: projectId,
          },
          role: {
            in: ["Designer", "PM"],
          },
        },
      });

      if (!userTeam) {
        return NextResponse.json(
          {
            error:
              "Only Designers and Project Managers can update wireframe links",
          },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    if (!data.wireframeLink) {
      return NextResponse.json(
        { error: "Wireframe link is required" },
        { status: 400 }
      );
    }

    try {
      new URL(data.wireframeLink);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        wireframe_link: data.wireframeLink,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating wireframe link:", error);
    return NextResponse.json(
      { error: "Failed to update wireframe link" },
      { status: 500 }
    );
  }
}

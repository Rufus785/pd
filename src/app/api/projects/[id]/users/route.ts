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

    const projectUsers = await prisma.userTeam.findMany({
      where: {
        team: {
          project_id: projectId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    const formattedUsers = projectUsers.map((pu) => ({
      user_id: pu.user_id,
      nickname: pu.user.nickname,
      role: pu.role,
      team_id: pu.team_id,
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching project users:", error);
    return NextResponse.json(
      { error: "Failed to fetch project users" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TeamRole } from "@prisma/client";

interface TeamMember {
  user_id: number;
  nickname: string;
  role: TeamRole;
}

function getTeamIdFromUrl(request: Request) {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split("/");
  return segments[3];
}

export async function GET(request: Request) {
  const id = Number.parseInt(getTeamIdFromUrl(request));
  if (isNaN(id)) {
    return NextResponse.json(
      { error: "Nieprawidłowy ID zespołu" },
      { status: 400 }
    );
  }

  try {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      return NextResponse.json(
        { error: "Zespół nie został znaleziony" },
        { status: 404 }
      );
    }

    const members: TeamMember[] = team.members.map((userTeam) => ({
      user_id: userTeam.user.id,
      nickname: userTeam.user.nickname,
      role: userTeam.role,
    }));

    return NextResponse.json({
      id: team.id,
      team_name: team.team_name,
      project_id: team.project_id,
      members,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { error: "Błąd podczas pobierania danych zespołu" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TeamRole } from "@prisma/client";

interface TeamMember {
  user_id: number;
  nickname: string;
  role: TeamRole;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = Number.parseInt(params.id);
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

    // Transform the data to match the expected format
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

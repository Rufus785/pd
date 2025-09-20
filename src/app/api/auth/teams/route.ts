import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const teams = await prisma.team.findMany({
      include: {
        project: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.team_name,
      project_id: team.project_id,
      project_name: team.project?.name || "Brak projektu",
      project_status: team.project?.status || "Brak projektu",
      members: team.members.map((member) => ({
        user_id: member.user_id,
        nickname: member.user.nickname,
        role: member.role,
      })),
    }));

    return Response.json(formattedTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return Response.json({ error: "Failed to fetch teams" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const team = await prisma.team.create({
      data: {
        team_name: data.name,
      },
    });

    if (data.members && data.members.length > 0) {
      for (const member of data.members) {
        await prisma.userTeam.create({
          data: {
            team_id: team.id,
            user_id: member.user_id,
            role: member.role,
          },
        });
      }
    }

    return Response.json({
      id: team.id,
      name: team.team_name,
      members: data.members || [],
    });
  } catch (error) {
    console.error("Error creating team:", error);
    return Response.json({ error: "Failed to create team" }, { status: 500 });
  }
}

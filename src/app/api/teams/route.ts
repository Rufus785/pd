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
    return new Response(JSON.stringify({ error: "Failed to fetch teams" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(request: Request) {
  const data = await request.json();

  const res = await prisma.team.create({
    data: {
      ...data,
    },
  });

  return Response.json(res);
}

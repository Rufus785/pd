import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all teams
export async function GET(request: Request) {
  try {
    // Step 1: Fetch all teams with their members and user details
    const teams = await prisma.team.findMany({
      include: {
        project: true, // Still include project for display purposes
        members: {
          include: {
            user: true, // Include user details for each member
          },
        },
      },
    });

    // Step 2: Transform data to match what the frontend expects
    const formattedTeams = teams.map((team) => ({
      id: team.id,
      name: team.team_name, // Convert team_name to name for frontend
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

// Create a new team
export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Step 1: Create the team with just the name
    const team = await prisma.team.create({
      data: {
        team_name: data.name, // Convert name to team_name
      },
    });

    // Step 2: Create team members if provided
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

    // Step 3: Return the created team
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

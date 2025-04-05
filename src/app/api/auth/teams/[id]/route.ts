import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = Number.parseInt(params.id);

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        project: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      return Response.json({ error: "Team not found" }, { status: 404 });
    }

    const formattedTeam = {
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
    };

    return Response.json(formattedTeam);
  } catch (error) {
    console.error("Error fetching team:", error);
    return Response.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = Number.parseInt(params.id);
    const data = await request.json();

    const updateData: any = {};

    if (data.name) {
      updateData.team_name = data.name;
    }

    if (data.project_id !== undefined) {
      updateData.project_id = data.project_id;
    }

    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: updateData,
    });

    if (data.members && data.members.length > 0) {
      await prisma.userTeam.deleteMany({
        where: {
          team_id: teamId,
        },
      });

      for (const member of data.members) {
        await prisma.userTeam.create({
          data: {
            team_id: teamId,
            user_id: member.user_id,
            role: member.role,
          },
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error updating team:", error);
    return Response.json({ error: "Failed to update team" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const teamId = Number.parseInt(params.id);

    await prisma.userTeam.deleteMany({
      where: {
        team_id: teamId,
      },
    });

    await prisma.team.delete({
      where: { id: teamId },
    });

    return Response.json({ message: "Zespół usunięty pomyślnie" });
  } catch (error) {
    console.error("Błąd podczas usuwania zespołu:", error);
    return Response.json(
      { message: "Nie udało się usunąć zespołu" },
      { status: 500 }
    );
  }
}

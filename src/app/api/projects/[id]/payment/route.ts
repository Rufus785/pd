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
          { error: "Only Project Managers can update payment status" },
          { status: 403 }
        );
      }
    }

    const data = await req.json();

    if (
      !data.paymentStatus ||
      !["Paid", "Unpaid"].includes(data.paymentStatus)
    ) {
      return NextResponse.json(
        { error: "Invalid payment status value" },
        { status: 400 }
      );
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        payment_status: data.paymentStatus,
      },
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating payment status:", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}

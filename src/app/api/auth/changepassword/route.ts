import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { compare, hash } from "bcrypt";

export async function POST(request: Request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();
    console.log("Received userId:", userId);

    const userIdInt = Number.parseInt(userId, 10);

    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdInt },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Incorrect current password" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userIdInt },
      data: {
        password_hash: hashedPassword,
        password_changed: true,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
      user: {
        id: user.id.toString(),
        passwordChanged: true,
      },
    });
  } catch (error) {
    console.error("Password change error:", error);
    return NextResponse.json(
      { error: "Error changing password" },
      { status: 500 }
    );
  }
}

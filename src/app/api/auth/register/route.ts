import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hash } from "bcrypt";

export async function POST(request: Request) {
  try {
    const { nickname, password_hash, roles } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { nickname },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await hash(password_hash, 10);

    const user = await prisma.user.create({
      data: {
        nickname,
        password_hash: hashedPassword,
        roles: {
          create: roles.map((roleName: string) => ({
            role: { connect: { name: roleName } },
          })),
        },
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Error creating user" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;

    if (role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can access users." }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        nip: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can access users." }, { status: 403 });
    }

    const body = await req.json();
    const { nip, name, email, password, role: newRole } = body;

    if (!nip || !name || !email || !password) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 });
    }

    // Check existing
    const existingNip = await prisma.user.findUnique({ where: { nip } });
    if (existingNip) return NextResponse.json({ error: "NIP sudah terdaftar" }, { status: 400 });

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });

    // Validate role against allowed enum values
    const allowedRoles = ["STUDENT", "ADMIN", "SUPER_ADMIN"];
    if (newRole && !allowedRoles.includes(newRole)) {
      return NextResponse.json({ error: `Role '${newRole}' tidak valid` }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nip,
        name,
        email,
        password: hashedPassword,
        role: newRole || "STUDENT",
      },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "CREATE_USER",
        entityType: "USER",
        entityId: newUser.nip,
        details: `Buat pengguna baru\nNama: ${name}\nNIP: ${nip}\nEmail: ${email}\nRole: ${newRole || "STUDENT"}`,
      }
    });

    return NextResponse.json({ success: true, user: { nip: newUser.nip, name: newUser.name } });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

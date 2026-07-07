import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Endpoint to register a User from an external application
// Requires Header: x-api-key: your-secret-key
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-api-key");
    const validKey = process.env.EXTERNAL_API_KEY;
    
    // Make sure to add EXTERNAL_API_KEY to your .env file
    if (!validKey || apiKey !== validKey) {
      return NextResponse.json({ error: "Unauthorized. Invalid or missing API Key." }, { status: 401 });
    }

    const body = await req.json();
    const { nip, name, email, password, role } = body;

    if (!nip || !name || !email) {
      return NextResponse.json({ error: "Missing required fields: nip, name, email" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ nip }, { email }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User with this NIP or email already exists" }, { status: 400 });
    }

    // Validate role - external API cannot create SUPER_ADMIN
    const allowedRoles = ["STUDENT", "ADMIN"];
    const safeRole = role && allowedRoles.includes(role) ? role : "STUDENT";

    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const authMethod = password ? "LOCAL" : "SSO";

    const user = await prisma.user.create({
      data: {
        nip,
        name,
        email,
        password: hashedPassword,
        role: safeRole,
        authMethod
      }
    });

    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ success: true, user: userWithoutPassword }, { status: 201 });
  } catch (error: any) {
    console.error("External create user error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

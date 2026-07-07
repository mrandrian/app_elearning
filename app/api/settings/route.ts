import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings: any[] = await prisma.$queryRaw`SELECT * FROM "Setting"`;
    
    // Default config if not present in DB
    const defaultConfig: Record<string, string> = {
      MAX_UPLOAD_SIZE_MB: "50",
    };

    settings.forEach((s) => {
      defaultConfig[s.key] = s.value;
    });

    return NextResponse.json({ settings: defaultConfig });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Whitelist of allowed setting keys
    const allowedKeys = ["MAX_UPLOAD_SIZE_MB"];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Setting key tidak diizinkan" }, { status: 400 });
    }

    // Ambil data lama sebelum perubahan
    const oldSettings: any[] = await prisma.$queryRaw`SELECT value FROM "Setting" WHERE key = ${key}`;
    const oldValue = oldSettings.length > 0 ? oldSettings[0].value : '(belum diset)';

    // Upsert equivalent
    await prisma.$executeRaw`
      INSERT INTO "Setting" (key, value) 
      VALUES (${key}, ${value})
      ON CONFLICT (key) DO UPDATE SET value = ${value}
    `;

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "UPDATE_SETTING",
        entityType: "SETTING",
        entityId: key,
        details: `Ubah pengaturan: ${key}\nNilai lama: ${oldValue}\nNilai baru: ${value}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update setting:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

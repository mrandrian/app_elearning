import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";
import AdmZip from "adm-zip";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    if (!["SUPER_ADMIN", "ADMIN", "STUDENT"].includes(role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file extension — STUDENT can only upload images (profile picture)
    const adminExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp',               // Images (no .svg — XSS vector)
      '.mp4', '.webm', '.ogg',                                 // Video
      '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', // Documents
      '.h5p', '.zip',                                           // H5P / Archive
    ];
    const studentExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    const allowedExtensions = role === "STUDENT" ? studentExtensions : adminExtensions;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json({ error: `Tipe file '${fileExtension}' tidak diizinkan.` }, { status: 400 });
    }

    // Check file size against Setting
    const settings: any[] = await prisma.$queryRaw`SELECT value FROM "Setting" WHERE key = 'MAX_UPLOAD_SIZE_MB' LIMIT 1`;
    let maxUploadMb = 50; // Default 50MB
    if (settings && settings.length > 0) {
       maxUploadMb = parseInt(settings[0].value) || 50;
    }
    
    if (file.size > maxUploadMb * 1024 * 1024) {
       return NextResponse.json({ error: `File terlalu besar. Maksimal ${maxUploadMb} MB.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public/uploads");
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    // Generate a unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, filename);

    // Write file to public/uploads
    await writeFile(filePath, buffer);

    let fileUrl = `/uploads/${filename}`;
    let extractPath = "";

    // If it's an H5P file, extract it
    if (filename.endsWith(".h5p")) {
      try {
        const zip = new AdmZip(filePath);
        const folderName = filename.replace(".h5p", "");
        const targetExtractPath = join(uploadDir, "h5p", folderName);
        
        if (!existsSync(targetExtractPath)) {
          mkdirSync(targetExtractPath, { recursive: true });
        }
        
        zip.extractAllTo(targetExtractPath, true);
        extractPath = `/uploads/h5p/${folderName}`;
        fileUrl = extractPath; // Use the extracted folder path as the main URL for H5P
      } catch (zipError) {
        console.error("Failed to extract H5P zip:", zipError);
        // We'll still return the original file path if extraction fails
      }
    }

    return NextResponse.json({ success: true, fileUrl, extractPath });
  } catch (error) {
    console.error("Failed to upload file:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

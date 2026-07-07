import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nip: string }> }
) {
  try {
    const { nip } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any).role;
    if (currentRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can edit users." }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    const dataToUpdate: any = {};
    if (name) dataToUpdate.name = name;
    if (email) dataToUpdate.email = email;
    if (role) {
      const allowedRoles = ["STUDENT", "ADMIN", "SUPER_ADMIN"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ error: `Role '${role}' tidak valid` }, { status: 400 });
      }
      dataToUpdate.role = role;
    }
    
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    // Ambil data lama sebelum perubahan
    const oldUser = await prisma.user.findUnique({ where: { nip }, select: { name: true, email: true, role: true } });
    if (!oldUser) return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { nip },
      data: dataToUpdate,
    });

    // Susun detail perubahan
    const changes: string[] = [];
    if (name && name !== oldUser.name) changes.push(`Nama: "${oldUser.name}" → "${name}"`);
    if (email && email !== oldUser.email) changes.push(`Email: "${oldUser.email || '-'}" → "${email}"`);
    if (role && role !== oldUser.role) changes.push(`Role: "${oldUser.role}" → "${role}"`);
    if (password) changes.push(`Password: diubah`);

    await prisma.auditLog.create({
      data: {
        adminNip: (session.user as any).id,
        action: "EDIT_USER",
        entityType: "USER",
        entityId: nip,
        details: `Edit pengguna (NIP: ${nip})\n${changes.length > 0 ? changes.join('\n') : 'Tidak ada perubahan'}`,
      }
    });

    return NextResponse.json({ success: true, user: { nip: updatedUser.nip, name: updatedUser.name } });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nip: string }> }
) {
  try {
    const { nip } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentRole = (session.user as any).role;
    if (currentRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden. Only Super Admin can delete users." }, { status: 403 });
    }

    // Don't allow superadmin to delete themselves
    if ((session.user as any).id === nip) {
      return NextResponse.json({ error: "Anda tidak dapat menghapus akun Anda sendiri" }, { status: 400 });
    }

    // Get user data before deleting
    const userToDelete = await prisma.user.findUnique({ where: { nip }, select: { name: true, email: true, role: true } });

    // Delete related AuditLogs to avoid foreign key constraints
    await prisma.auditLog.deleteMany({
      where: { adminNip: nip }
    });

    // Reassign any courses taught by this user to the Super Admin who is deleting them
    const superAdminNip = (session.user as any).id;
    const reassignedCourses = await prisma.course.updateMany({
      where: { teacherNip: nip },
      data: { teacherNip: superAdminNip }
    });

    await prisma.user.delete({
      where: { nip },
    });

    await prisma.auditLog.create({
      data: {
        adminNip: superAdminNip,
        action: "DELETE_USER",
        entityType: "USER",
        entityId: nip,
        details: `Hapus pengguna (NIP: ${nip})\nNama: ${userToDelete?.name || '-'}\nEmail: ${userToDelete?.email || '-'}\nRole: ${userToDelete?.role || '-'}\nKursus yang dialihkan ke Anda: ${reassignedCourses.count}`,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

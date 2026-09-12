import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dc-ops-secret-key-2026-super-secure';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, fullName, department } = req.body;

    if (!username || !password || !fullName) {
      res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อผู้ใช้, รหัสผ่าน, ชื่อ-นามสกุล)' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (existingUser) {
      res.status(400).json({ message: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // If this is the very first user in the system, automatically make them approved ADMIN!
    const userCount = await prisma.user.count();
    const isFirstUser = userCount === 0;

    const newUser = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        passwordHash,
        fullName: fullName.trim(),
        department: department?.trim() || 'Data Center Operations',
        role: isFirstUser ? 'ADMIN' : 'OPERATOR',
        status: isFirstUser ? 'APPROVED' : 'PENDING',
      },
    });

    res.status(201).json({
      message: isFirstUser
        ? 'สร้างบัญชีผู้ดูแลระบบ (Admin) แรกสำเร็จ คุณสามารถเข้าสู่ระบบได้ทันที'
        : 'ลงทะเบียนสำเร็จ! บัญชีของคุณอยู่ระหว่างรอการอนุมัติจาก Admin ก่อนเริ่มใช้งาน',
      user: {
        id: newUser.id,
        username: newUser.username,
        fullName: newUser.fullName,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });

    if (!user) {
      res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      return;
    }

    if (user.status === 'PENDING') {
      res.status(403).json({
        message: 'บัญชีของคุณอยู่ระหว่างรอการอนุมัติจากผู้ดูแลระบบ (Admin) กรุณาติดต่อหัวหน้างาน',
        status: 'PENDING',
      });
      return;
    }

    if (user.status === 'REJECTED') {
      res.status(403).json({
        message: 'บัญชีของคุณไม่ได้รับการอนุมัติการเข้าใช้งานระบบ',
        status: 'REJECTED',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'ไม่ได้เข้าสู่ระบบ' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        department: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', error: error.message });
  }
};

export const getPendingUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        username: true,
        fullName: true,
        department: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users: pendingUsers });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullName: true,
        department: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { status, role } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      res.status(400).json({ message: 'สถานะไม่ถูกต้อง' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        ...(role && ['ADMIN', 'OPERATOR'].includes(role) ? { role } : {}),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    res.json({
      message: `ปรับปรุงสถานะผู้ใช้ ${updatedUser.username} เป็น ${status} สำเร็จ`,
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการปรับปรุงสถานะ', error: error.message });
  }
};

export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;
    const { fullName, department, username, role, status } = req.body;

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ message: 'ไม่พบผู้ใช้นี้ในระบบ' });
      return;
    }

    if (username && username !== existing.username) {
      const duplicate = await prisma.user.findUnique({ where: { username } });
      if (duplicate) {
        res.status(400).json({ message: 'ชื่อผู้ใช้งาน (Username) นี้มีผู้อื่นใช้งานแล้ว' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(department !== undefined ? { department } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(role && ['ADMIN', 'OPERATOR'].includes(role) ? { role } : {}),
        ...(status && ['APPROVED', 'PENDING', 'REJECTED'].includes(status) ? { status } : {}),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        department: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({ message: 'แก้ไขข้อมูลผู้ใช้สำเร็จ', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้', error: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId as string;

    if (req.user?.id === userId) {
      res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      res.status(404).json({ message: 'ไม่พบผู้ใช้นี้ในระบบ' });
      return;
    }

    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: `ลบผู้ใช้ ${existing.fullName} (@${existing.username}) เรียบร้อยแล้ว` });
  } catch (error: any) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบผู้ใช้', error: error.message });
  }
};


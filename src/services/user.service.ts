import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function createUser(data: { name: string; email: string; password: string; phone?: string }) {
  const hashed = await bcrypt.hash(data.password, 10);
  return prisma.user.create({ data: { ...data, password: hashed } });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await findByEmail(email);
  if (!user) return null;
  const match = await bcrypt.compare(password, user.password);
  if (!match) return null;
  return user;
}

export async function generateResetToken(email: string) {
  const user = await findByEmail(email);
  if (!user) return null;
  const token = uuidv4();
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
  await prisma.user.update({ where: { email }, data: { resetToken: token, resetTokenExpiry: expiry } });
  return token;
}

export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user) return null;
  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) return null;
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetTokenExpiry: null } });
  return true;
}

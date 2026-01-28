// src/services/auth.service.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Veritabanı Bağlantı Havuzu (Connection Pool) oluşturulur.
const prisma = new PrismaClient();

export const registerUser = async (email: string, username: string, passwordPlain: string) => {
  const passwordHash = await bcrypt.hash(passwordPlain, 10); // salt=10 for rainbıw attack
  // INSERT
  const user = await prisma.user.create({
    data: { email, username, password: passwordHash },
  });
  return { id: user.id, email: user.email, username: user.username };
};

export const loginUser = async (email: string, passwordPlain: string, jwt: any) => {
  // SELECT
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
  	return null;

  const isValid = await bcrypt.compare(passwordPlain, user.password);
  if (!isValid)
  	return null;

  const token = jwt.sign({ id: user.id, email: user.email, username: user.username });
  return { token, user: { id: user.id, email: user.email, username: user.username } };
};
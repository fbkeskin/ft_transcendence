"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
// src/services/auth.service.ts
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Veritabanı Bağlantı Havuzu (Connection Pool) oluşturulur.
const prisma = new client_1.PrismaClient();
const registerUser = async (email, username, passwordPlain) => {
    const passwordHash = await bcryptjs_1.default.hash(passwordPlain, 10); // salt=10 for rainbıw attack
    // INSERT
    const user = await prisma.user.create({
        data: { email, username, password: passwordHash },
    });
    return { id: user.id, email: user.email, username: user.username };
};
exports.registerUser = registerUser;
const loginUser = async (email, passwordPlain, jwt) => {
    // SELECT
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return null;
    const isValid = await bcryptjs_1.default.compare(passwordPlain, user.password);
    if (!isValid)
        return null;
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username });
    return { token, user: { id: user.id, email: user.email, username: user.username } };
};
exports.loginUser = loginUser;

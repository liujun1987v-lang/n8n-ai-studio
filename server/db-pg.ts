import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { users, chatMessages, connectors, actionLogs } from "../drizzle/pg-schema";
import { ENV } from './_core/env';

let _db: any = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: any): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(users).values({
    openId: user.openId,
    name: user.name,
    email: user.email,
    loginMethod: user.loginMethod,
    role: user.role || (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
    lastSignedIn: new Date(),
  }).onConflictDoUpdate({
    target: users.openId,
    set: {
      name: user.name,
      email: user.email,
      lastSignedIn: new Date(),
    }
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getChatHistory(userId: number, conversationId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(chatMessages).where(and(eq(chatMessages.userId, userId), eq(chatMessages.conversationId, conversationId))).orderBy(desc(chatMessages.createdAt)).limit(limit);
}

export async function saveChatMessage(userId: number, conversationId: string, role: any, content: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(chatMessages).values({ userId, conversationId, role, content });
}

export async function getConnectors(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(connectors).where(eq(connectors.userId, userId));
}

export async function saveConnector(userId: number, type: any, name: string, encryptedToken: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(connectors).values({ userId, type, name, encryptedToken });
}

export async function deleteConnector(userId: number, connectorId: number) {
  const db = await getDb();
  if (!db) return null;
  return await db.delete(connectors).where(and(eq(connectors.userId, userId), eq(connectors.id, connectorId)));
}

export async function getActionLogs(userId: number, jobId: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(actionLogs).where(and(eq(actionLogs.userId, userId), eq(actionLogs.jobId, jobId))).orderBy(desc(actionLogs.timestamp)).limit(limit);
}

export async function saveActionLog(userId: number, jobId: string, action: string, status: any, details?: string) {
  const db = await getDb();
  if (!db) return null;
  return await db.insert(actionLogs).values({ userId, jobId, action, status, details });
}

import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, chatMessages, connectors, actionLogs, ChatMessage, Connector, ActionLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Chat message queries
export async function getChatHistory(userId: number, conversationId: string, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(chatMessages)
    .where(and(eq(chatMessages.userId, userId), eq(chatMessages.conversationId, conversationId)))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function saveChatMessage(userId: number, conversationId: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(chatMessages).values({
    userId,
    conversationId,
    role,
    content,
  });
  
  return result;
}

// Connector queries
export async function getConnectors(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(connectors).where(eq(connectors.userId, userId));
}

export async function saveConnector(userId: number, type: "github" | "huggingface" | "vercel", name: string, encryptedToken: string) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(connectors).values({
    userId,
    type,
    name,
    encryptedToken,
  });
}

export async function deleteConnector(userId: number, connectorId: number) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.delete(connectors).where(and(eq(connectors.userId, userId), eq(connectors.id, connectorId)));
}

// Action log queries
export async function getActionLogs(userId: number, jobId: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(actionLogs)
    .where(and(eq(actionLogs.userId, userId), eq(actionLogs.jobId, jobId)))
    .orderBy(desc(actionLogs.timestamp))
    .limit(limit);
}

export async function saveActionLog(userId: number, jobId: string, action: string, status: "pending" | "running" | "success" | "error", details?: string) {
  const db = await getDb();
  if (!db) return null;
  
  return await db.insert(actionLogs).values({
    userId,
    jobId,
    action,
    status,
    details,
  });
}

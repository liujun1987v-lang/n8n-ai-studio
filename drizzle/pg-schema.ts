import { pgTable, serial, text, timestamp, varchar, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const connectorTypeEnum = pgEnum("connector_type", ["github", "huggingface", "vercel"]);
export const statusEnum = pgEnum("status", ["pending", "running", "success", "error"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  conversationId: varchar("conversationId", { length: 64 }).notNull(),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const connectors = pgTable("connectors", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  type: connectorTypeEnum("type").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  encryptedToken: text("encryptedToken").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const actionLogs = pgTable("action_logs", {
  id: serial("id").primaryKey(),
  userId: int("userId").notNull(),
  jobId: varchar("jobId", { length: 64 }).notNull(),
  action: varchar("action", { length: 255 }).notNull(),
  status: statusEnum("status").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

import { integer as int } from "drizzle-orm/pg-core";

import { Response } from "express";
import { saveActionLog } from "../db";

interface StreamClient {
  res: Response;
  userId: number;
  jobId: string;
  heartbeatInterval?: NodeJS.Timeout;
}

const activeStreams = new Map<string, StreamClient[]>();

export function subscribeToActionLogs(res: Response, userId: number, jobId: string) {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const key = `${userId}:${jobId}`;
  const client: StreamClient = { res, userId, jobId };

  if (!activeStreams.has(key)) {
    activeStreams.set(key, []);
  }

  activeStreams.get(key)!.push(client);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: "connected", message: "Connected to action stream" })}\n\n`);

  // Set up heartbeat to keep connection alive
  client.heartbeatInterval = setInterval(() => {
    try {
      res.write(`:heartbeat at ${new Date().toISOString()}\n\n`);
    } catch (error) {
      if (client.heartbeatInterval) {
        clearInterval(client.heartbeatInterval);
      }
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Handle client disconnect
  res.on("close", () => {
    if (client.heartbeatInterval) {
      clearInterval(client.heartbeatInterval);
    }
    const clients = activeStreams.get(key);
    if (clients) {
      const index = clients.indexOf(client);
      if (index > -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        activeStreams.delete(key);
      }
    }
  });

  res.on("error", () => {
    if (client.heartbeatInterval) {
      clearInterval(client.heartbeatInterval);
    }
    const clients = activeStreams.get(key);
    if (clients) {
      const index = clients.indexOf(client);
      if (index > -1) {
        clients.splice(index, 1);
      }
      if (clients.length === 0) {
        activeStreams.delete(key);
      }
    }
  });
}

export async function broadcastActionLog(
  userId: number,
  jobId: string,
  action: string,
  status: "pending" | "running" | "success" | "error",
  details?: string
) {
  // Save to database
  await saveActionLog(userId, jobId, action, status, details);

  // Broadcast to all connected clients
  const key = `${userId}:${jobId}`;
  const clients = activeStreams.get(key);

  if (clients && clients.length > 0) {
    const event = {
      type: "action",
      action,
      status,
      details,
      timestamp: new Date().toISOString(),
    };

    clients.forEach((client) => {
      try {
        client.res.write(`data: ${JSON.stringify(event)}\n\n`);
      } catch (error) {
        console.error("Error writing to stream:", error);
      }
    });
  }
}

export function getActiveStreamCount(userId: number, jobId: string): number {
  const key = `${userId}:${jobId}`;
  return activeStreams.get(key)?.length || 0;
}

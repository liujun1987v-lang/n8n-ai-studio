import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure, ownerProcedure } from "./_core/trpc";
import { getChatHistory, saveChatMessage, getConnectors, saveConnector, deleteConnector, getActionLogs, saveActionLog } from "./db";
import { encryptToken, decryptToken } from "./services/encryptionService";
import { invokeOrchestrator } from "./services/orchestratorService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  chat: router({
    getHistory: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          conversationId: typeof obj.conversationId === "string" ? obj.conversationId : "",
          limit: typeof obj.limit === "number" ? obj.limit : 50,
        };
      })
      .query(async ({ ctx, input }) => {
        return getChatHistory(ctx.user.id, input.conversationId, input.limit);
      }),

    sendMessage: protectedProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          conversationId: typeof obj.conversationId === "string" ? obj.conversationId : "",
          role: (typeof obj.role === "string" && ["user", "assistant"].includes(obj.role) ? obj.role : "user") as "user" | "assistant",
          content: typeof obj.content === "string" ? obj.content : "",
        };
      })
      .mutation(async ({ ctx, input }) => {
        return saveChatMessage(ctx.user.id, input.conversationId, input.role, input.content);
      }),
  }),

  connectors: router({
    list: ownerProcedure.query(async ({ ctx }) => {
      return getConnectors(ctx.user.id);
    }),

    save: ownerProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          type: (typeof obj.type === "string" && ["github", "huggingface", "vercel"].includes(obj.type) ? obj.type : "github") as "github" | "huggingface" | "vercel",
          name: typeof obj.name === "string" ? obj.name : "",
          token: typeof obj.token === "string" ? obj.token : "",
        };
      })
      .mutation(async ({ ctx, input }) => {
        const encryptedToken = encryptToken(input.token);
        return saveConnector(ctx.user.id, input.type, input.name, encryptedToken);
      }),

    delete: ownerProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          connectorId: typeof obj.connectorId === "number" ? obj.connectorId : 0,
        };
      })
      .mutation(async ({ ctx, input }) => {
        return deleteConnector(ctx.user.id, input.connectorId);
      }),
  }),

  orchestrator: router({
    invoke: ownerProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          goal: typeof obj.goal === "string" ? obj.goal : "",
          action: typeof obj.action === "string" ? obj.action : "workflow",
          params: (typeof obj.params === "object" && obj.params !== null ? obj.params : {}) as Record<string, unknown>,
        };
      })
      .mutation(async ({ ctx, input }) => {
        return invokeOrchestrator(input.goal, input.action, input.params);
      }),

    getActionLogs: ownerProcedure
      .input((val: unknown) => {
        if (typeof val !== "object" || val === null) throw new Error("Invalid input");
        const obj = val as Record<string, unknown>;
        return {
          jobId: typeof obj.jobId === "string" ? obj.jobId : "",
          limit: typeof obj.limit === "number" ? obj.limit : 100,
        };
      })
      .query(async ({ ctx, input }) => {
        return getActionLogs(ctx.user.id, input.jobId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;

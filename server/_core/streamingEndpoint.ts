import { Router } from "express";
import { subscribeToActionLogs } from "../services/streamingService";
import { sdk } from "./sdk";

export function createStreamingRouter() {
  const router = Router();

  router.get("/api/stream/actions/:jobId", async (req, res) => {
    try {
      // Verify authentication using SDK
      let user = null;
      try {
        user = await sdk.authenticateRequest(req);
      } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({ error: "Job ID is required" });
      }

      // Subscribe to action logs
      subscribeToActionLogs(res, user.id, jobId);
    } catch (error) {
      console.error("Streaming endpoint error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

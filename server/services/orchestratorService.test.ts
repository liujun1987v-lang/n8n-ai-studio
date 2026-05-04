import { describe, it, expect, beforeEach, vi } from "vitest";
import { invokeOrchestrator, getJobStatus } from "./orchestratorService";

// Mock fetch globally
global.fetch = vi.fn();

describe("orchestratorService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ORCHESTRATOR_URL = "https://test-orchestrator.example.com";
  });

  describe("invokeOrchestrator", () => {
    it("should successfully invoke the orchestrator with valid parameters", async () => {
      const mockResponse = { jobId: "job-123", status: "queued" };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await invokeOrchestrator("my goal", "workflow", { key: "value" });

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-orchestrator.example.com/jobs",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: "my goal",
            action: "workflow",
            params: { key: "value" },
          }),
        })
      );
    });

    it("should use default orchestrator URL if not set", async () => {
      delete process.env.ORCHESTRATOR_URL;

      const mockResponse = { jobId: "job-456" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await invokeOrchestrator("goal", "action", {});

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("n8n-ai-orchestrator-production"),
        expect.any(Object)
      );
    });

    it("should throw an error if orchestrator returns non-ok response", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      });

      await expect(
        invokeOrchestrator("goal", "action", {}, { maxRetries: 0 })
      ).rejects.toThrow("Orchestrator returned 500");
    });

    it("should retry on transient failures", async () => {
      // First call fails, second succeeds
      (global.fetch as any)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jobId: "job-789" }),
        });

      const result = await invokeOrchestrator("goal", "action", {}, { 
        maxRetries: 1, 
        initialBackoff: 10 
      });
      
      expect(result).toEqual({ jobId: "job-789" });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should throw an error after max retries are exceeded", async () => {
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      await expect(
        invokeOrchestrator("goal", "action", {}, { maxRetries: 0, initialBackoff: 10 })
      ).rejects.toThrow("failed after 1 attempt");
    });
  });

  describe("getJobStatus", () => {
    it("should retrieve job status successfully", async () => {
      const mockStatus = { jobId: "job-123", status: "running", progress: 50 };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await getJobStatus("job-123");

      expect(result).toEqual(mockStatus);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://test-orchestrator.example.com/jobs/job-123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should throw an error if job status retrieval fails", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: "Not Found",
      });

      await expect(getJobStatus("invalid-job")).rejects.toThrow("Failed to get job status");
    });
  });
});

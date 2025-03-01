import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertJobSchema, insertProposalSchema, insertMessageSchema, insertMilestoneSchema, insertEscrowTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Jobs
  app.post("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "client") return res.sendStatus(403);

    console.log("Creating new job with data:", req.body);

    const parsedJob = insertJobSchema.parse({
      ...req.body,
      clientId: req.user.id
    });

    const job = await storage.createJob(parsedJob);
    console.log("Created job:", job);
    res.status(201).json(job);
  });

  app.get("/api/jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const jobs = await storage.getJobs();
    res.json(jobs);
  });

  app.get("/api/jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const jobId = parseInt(req.params.id);
    if (isNaN(jobId)) {
      console.log(`Invalid job ID format: ${req.params.id}`);
      return res.sendStatus(400);
    }

    console.log(`Fetching job with ID: ${jobId}`);
    const job = await storage.getJob(jobId);

    if (!job) {
      console.log(`Job not found with ID: ${jobId}`);
      return res.sendStatus(404);
    }

    console.log(`Found job:`, job);
    res.json(job);
  });

  // Proposals
  app.post("/api/proposals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "vendor") return res.sendStatus(403);

    const parsedProposal = insertProposalSchema.parse({
      ...req.body,
      vendorId: req.user.id
    });

    const proposal = await storage.createProposal(parsedProposal);
    res.status(201).json(proposal);
  });

  app.get("/api/jobs/:jobId/proposals", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.sendStatus(400);

    const proposals = await storage.getProposalsByJob(jobId);
    res.json(proposals);
  });

  // Messages
  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const parsedMessage = insertMessageSchema.parse({
      ...req.body,
      senderId: req.user.id
    });

    const message = await storage.createMessage(parsedMessage);
    res.status(201).json(message);
  });

  app.get("/api/messages/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessagesBetweenUsers(
      req.user.id,
      parseInt(req.params.userId)
    );
    res.json(messages);
  });

  // Milestones
  app.post("/api/jobs/:jobId/milestones", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.userType !== "client") return res.sendStatus(403);

    const job = await storage.getJob(parseInt(req.params.jobId));
    if (!job) return res.sendStatus(404);
    if (job.clientId !== req.user.id) return res.sendStatus(403);

    const parsedMilestone = insertMilestoneSchema.parse({
      ...req.body,
      jobId: job.id
    });

    const milestone = await storage.createMilestone(parsedMilestone);
    res.status(201).json(milestone);
  });

  app.get("/api/jobs/:jobId/milestones", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const jobId = parseInt(req.params.jobId);
    if (isNaN(jobId)) return res.sendStatus(400);

    const milestones = await storage.getMilestonesByJob(jobId);
    res.json(milestones);
  });

  app.patch("/api/milestones/:id/status", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const milestone = await storage.getMilestone(parseInt(req.params.id));
    if (!milestone) return res.sendStatus(404);

    const job = await storage.getJob(milestone.jobId);
    if (!job) return res.sendStatus(404);

    const statusSchema = z.object({
      status: z.enum(['completed', 'approved', 'released'])
    });

    const { status } = statusSchema.parse(req.body);

    // Only vendors can mark milestones as completed
    if (status === 'completed' && req.user.userType !== 'vendor') {
      return res.sendStatus(403);
    }

    // Only clients can approve and release milestones
    if ((status === 'approved' || status === 'released') &&
        (req.user.userType !== 'client' || job.clientId !== req.user.id)) {
      return res.sendStatus(403);
    }

    const updatedMilestone = await storage.updateMilestoneStatus(milestone.id, status);

    // When a milestone is approved, create an escrow transaction
    if (status === 'approved') {
      await storage.createEscrowTransaction({
        milestoneId: milestone.id,
        amount: milestone.amount
      });
    }

    // When a milestone is released, update the escrow transaction
    if (status === 'released') {
      const [escrowTx] = await storage.getEscrowTransactionsByMilestone(milestone.id);
      if (escrowTx) {
        await storage.updateEscrowStatus(escrowTx.id, 'released');
      }
    }

    res.json(updatedMilestone);
  });

  // Profile
  app.patch("/api/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const updateSchema = z.object({
      fullName: z.string().optional(),
      description: z.string().optional(),
      skills: z.array(z.string()).optional(),
      portfolio: z.array(z.object({
        title: z.string(),
        description: z.string()
      })).optional()
    });

    const updates = updateSchema.parse(req.body);
    const user = await storage.updateUser(req.user.id, updates);
    res.json(user);
  });

  const httpServer = createServer(app);
  return httpServer;
}

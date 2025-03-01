import { users, jobs, proposals, messages, milestones, escrowTransactions } from "@shared/schema";
import type { InsertUser, User, Job, InsertJob, Proposal, InsertProposal, Message, InsertMessage, Milestone, InsertMilestone, EscrowTransaction, InsertEscrowTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User>;

  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getJobs(): Promise<Job[]>;
  getJobsByClient(clientId: number): Promise<Job[]>;

  // Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposalsByJob(jobId: number): Promise<Proposal[]>;
  getProposalsByVendor(vendorId: number): Promise<Proposal[]>;

  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]>;

  // Milestone operations
  createMilestone(milestone: InsertMilestone): Promise<Milestone>;
  getMilestone(id: number): Promise<Milestone | undefined>;
  getMilestonesByJob(jobId: number): Promise<Milestone[]>;
  updateMilestoneStatus(id: number, status: string, timestamp?: Date): Promise<Milestone>;

  // Escrow operations
  createEscrowTransaction(transaction: InsertEscrowTransaction): Promise<EscrowTransaction>;
  getEscrowTransaction(id: number): Promise<EscrowTransaction | undefined>;
  getEscrowTransactionsByMilestone(milestoneId: number): Promise<EscrowTransaction[]>;
  updateEscrowStatus(id: number, status: string, timestamp?: Date): Promise<EscrowTransaction>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db.insert(jobs).values(insertJob).returning();
    return job;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(): Promise<Job[]> {
    return db.select().from(jobs);
  }

  async getJobsByClient(clientId: number): Promise<Job[]> {
    return db.select().from(jobs).where(eq(jobs.clientId, clientId));
  }

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db.insert(proposals).values(insertProposal).returning();
    return proposal;
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async getProposalsByJob(jobId: number): Promise<Proposal[]> {
    return db.select().from(proposals).where(eq(proposals.jobId, jobId));
  }

  async getProposalsByVendor(vendorId: number): Promise<Proposal[]> {
    return db.select().from(proposals).where(eq(proposals.vendorId, vendorId));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessagesBetweenUsers(user1Id: number, user2Id: number): Promise<Message[]> {
    return db.select().from(messages).where(
      or(
        and(
          eq(messages.senderId, user1Id),
          eq(messages.receiverId, user2Id)
        ),
        and(
          eq(messages.senderId, user2Id),
          eq(messages.receiverId, user1Id)
        )
      )
    );
  }

  async createMilestone(insertMilestone: InsertMilestone): Promise<Milestone> {
    const [milestone] = await db.insert(milestones).values(insertMilestone).returning();
    return milestone;
  }

  async getMilestone(id: number): Promise<Milestone | undefined> {
    const [milestone] = await db.select().from(milestones).where(eq(milestones.id, id));
    return milestone;
  }

  async getMilestonesByJob(jobId: number): Promise<Milestone[]> {
    return db.select().from(milestones).where(eq(milestones.jobId, jobId));
  }

  async updateMilestoneStatus(id: number, status: string, timestamp: Date = new Date()): Promise<Milestone> {
    const updates: Partial<Milestone> = { status };

    switch (status) {
      case 'completed':
        updates.completedAt = timestamp;
        break;
      case 'approved':
        updates.approvedAt = timestamp;
        break;
    }

    const [milestone] = await db.update(milestones)
      .set(updates)
      .where(eq(milestones.id, id))
      .returning();
    return milestone;
  }

  async createEscrowTransaction(insertTransaction: InsertEscrowTransaction): Promise<EscrowTransaction> {
    const [transaction] = await db.insert(escrowTransactions).values(insertTransaction).returning();
    return transaction;
  }

  async getEscrowTransaction(id: number): Promise<EscrowTransaction | undefined> {
    const [transaction] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.id, id));
    return transaction;
  }

  async getEscrowTransactionsByMilestone(milestoneId: number): Promise<EscrowTransaction[]> {
    return db.select().from(escrowTransactions).where(eq(escrowTransactions.milestoneId, milestoneId));
  }

  async updateEscrowStatus(id: number, status: string, timestamp: Date = new Date()): Promise<EscrowTransaction> {
    const updates: Partial<EscrowTransaction> = { status };

    switch (status) {
      case 'released':
        updates.releasedAt = timestamp;
        break;
      case 'refunded':
        updates.refundedAt = timestamp;
        break;
    }

    const [transaction] = await db.update(escrowTransactions)
      .set(updates)
      .where(eq(escrowTransactions.id, id))
      .returning();
    return transaction;
  }
}

export const storage = new DatabaseStorage();

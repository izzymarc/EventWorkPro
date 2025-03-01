import { pgTable, text, serial, integer, boolean, json, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  userType: text("user_type").notNull(), // 'client' or 'vendor'
  fullName: text("full_name").notNull(),
  description: text("description"),
  skills: text("skills").array(),
  portfolio: json("portfolio").$type<{title: string, description: string}[]>().default([])
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  budget: integer("budget").notNull(),
  category: text("category").notNull(),
  clientId: integer("client_id").notNull(),
  status: text("status").notNull().default('open'),
  createdAt: timestamp("created_at").defaultNow()
});

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  vendorId: integer("vendor_id").notNull(),
  coverLetter: text("cover_letter").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const milestones = pgTable("milestones", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  status: text("status").notNull().default('pending'), // pending, completed, approved, released
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  approvedAt: timestamp("approved_at")
});

export const escrowTransactions = pgTable("escrow_transactions", {
  id: serial("id").primaryKey(),
  milestoneId: integer("milestone_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('held'), // held, released, refunded
  createdAt: timestamp("created_at").defaultNow(),
  releasedAt: timestamp("released_at"),
  refundedAt: timestamp("refunded_at")
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  userType: true,
  fullName: true,
  description: true,
  skills: true
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  title: true,
  description: true,
  budget: true,
  category: true,
  clientId: true
});

export const insertProposalSchema = createInsertSchema(proposals).pick({
  jobId: true,
  vendorId: true,
  coverLetter: true,
  price: true
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true
});

export const insertMilestoneSchema = createInsertSchema(milestones).pick({
  jobId: true,
  title: true,
  description: true,
  amount: true,
  dueDate: true
});

export const insertEscrowTransactionSchema = createInsertSchema(escrowTransactions).pick({
  milestoneId: true,
  amount: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Milestone = typeof milestones.$inferSelect;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;

export const EVENT_CATEGORIES = [
  'Wedding',
  'Corporate Event',
  'Birthday Party',
  'Conference',
  'Concert',
  'Private Party',
  'Exhibition',
  'Other'
] as const;

import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  timeLimit: integer("time_limit").notNull(), // in minutes
  isActive: boolean("is_active").default(true),
  qrCode: text("qr_code"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(), // "multiple_choice", "true_false", "fill_blank"
  options: text("options").array(), // JSON array for MCQ options
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").default(10),
  orderIndex: integer("order_index").notNull(),
});

export const participants = pgTable("participants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id").notNull().references(() => participants.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  answers: text("answers").notNull(), // JSON object with questionId: answer mappings
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  completionTime: integer("completion_time").notNull(), // in seconds
  submittedAt: timestamp("submitted_at").defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  qrCode: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertParticipantSchema = createInsertSchema(participants).omit({
  id: true,
  createdAt: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  submittedAt: true,
});

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;

export type QuizWithQuestions = Quiz & {
  questions: Question[];
};

export type LeaderboardEntry = {
  participantId: number;
  name: string;
  email: string;
  score: number;
  completionTime: number;
  rank: number;
  accuracy: number;
};

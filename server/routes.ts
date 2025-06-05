import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuizSchema, insertQuestionSchema, insertParticipantSchema, insertSubmissionSchema } from "@shared/schema";
import QRCode from "qrcode";

export async function registerRoutes(app: Express): Promise<Server> {
  // Quiz routes
  app.post("/api/quizzes", async (req, res) => {
    try {
      const quizData = insertQuizSchema.parse(req.body);
      const quiz = await storage.createQuiz(quizData);
      res.json(quiz);
    } catch (error) {
      res.status(400).json({ message: "Invalid quiz data", error: (error as Error).message });
    }
  });

  app.get("/api/quizzes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuizWithQuestions(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz", error: (error as Error).message });
    }
  });

  app.get("/api/quizzes/qr/:qrCode", async (req, res) => {
    try {
      const qrCode = req.params.qrCode;
      const quiz = await storage.getQuizByQrCode(qrCode);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz", error: (error as Error).message });
    }
  });

  app.post("/api/quizzes/:id/qr-code", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const qrCodeData = `quiz-${id}-${Date.now()}`;
      const quizUrl = `${req.protocol}://${req.get('host')}/quiz/${qrCodeData}`;
      const qrCodeDataUrl = await QRCode.toDataURL(quizUrl);
      
      const updatedQuiz = await storage.updateQuizQrCode(id, qrCodeData);
      res.json({ qrCode: qrCodeData, qrCodeDataUrl, quiz: updatedQuiz });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR code", error: (error as Error).message });
    }
  });

  // Question routes
  app.post("/api/questions", async (req, res) => {
    try {
      const questionData = insertQuestionSchema.parse(req.body);
      const question = await storage.createQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error: (error as Error).message });
    }
  });

  app.get("/api/quizzes/:quizId/questions", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const questions = await storage.getQuestionsByQuizId(quizId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch questions", error: (error as Error).message });
    }
  });

  app.delete("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteQuestion(id);
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question", error: (error as Error).message });
    }
  });

  app.put("/api/questions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = insertQuestionSchema.partial().parse(req.body);
      const question = await storage.updateQuestion(id, updateData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data", error: (error as Error).message });
    }
  });

  // Participant routes
  app.post("/api/participants", async (req, res) => {
    try {
      const participantData = insertParticipantSchema.parse(req.body);
      
      // Check if participant already exists for this quiz
      const existingParticipant = await storage.getParticipantByEmailAndQuiz(
        participantData.email, 
        participantData.quizId
      );
      
      if (existingParticipant) {
        return res.status(400).json({ message: "Participant already registered for this quiz" });
      }

      const participant = await storage.createParticipant(participantData);
      res.json(participant);
    } catch (error) {
      res.status(400).json({ message: "Invalid participant data", error: (error as Error).message });
    }
  });

  // Submission routes
  app.post("/api/submissions", async (req, res) => {
    try {
      const submissionData = insertSubmissionSchema.parse(req.body);
      
      // Check if participant already submitted
      const existingSubmission = await storage.getSubmissionByParticipant(submissionData.participantId);
      if (existingSubmission) {
        return res.status(400).json({ message: "Participant has already submitted this quiz" });
      }

      const submission = await storage.createSubmission(submissionData);
      res.json(submission);
    } catch (error) {
      res.status(400).json({ message: "Invalid submission data", error: (error as Error).message });
    }
  });

  app.get("/api/participants/:participantId/submission", async (req, res) => {
    try {
      const participantId = parseInt(req.params.participantId);
      const submission = await storage.getSubmissionByParticipant(participantId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submission", error: (error as Error).message });
    }
  });

  // Leaderboard routes
  app.get("/api/quizzes/:quizId/leaderboard", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const leaderboard = await storage.getLeaderboard(quizId);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leaderboard", error: (error as Error).message });
    }
  });

  app.get("/api/quizzes/:quizId/stats", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const stats = await storage.getQuizStats(quizId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz stats", error: (error as Error).message });
    }
  });

  // Export results (CSV format)
  app.get("/api/quizzes/:quizId/export", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const leaderboard = await storage.getLeaderboard(quizId);
      
      const csvHeader = "Rank,Name,Email,Score,Completion Time (seconds),Accuracy (%)\n";
      const csvRows = leaderboard.map(entry => 
        `${entry.rank},"${entry.name}","${entry.email}",${entry.score},${entry.completionTime},${entry.accuracy}`
      ).join("\n");
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="quiz-${quizId}-results.csv"`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: "Failed to export results", error: (error as Error).message });
    }
  });

  // Admin dashboard stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const allQuizzes = await storage.getAllQuizzes();
      const stats = await Promise.all(allQuizzes.map(async (quiz) => {
        const quizStats = await storage.getQuizStats(quiz.id);
        return {
          quizId: quiz.id,
          title: quiz.title,
          ...quizStats,
          totalQuestions: (await storage.getQuestionsByQuizId(quiz.id)).length,
          createdAt: quiz.createdAt
        };
      }));
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats", error: (error as Error).message });
    }
  });

  // Detailed quiz results for admin
  app.get("/api/admin/quizzes/:quizId/results", async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const questions = await storage.getQuestionsByQuizId(quizId);
      const submissions = await storage.getSubmissionsByQuiz(quizId);
      const participants = await Promise.all(
        submissions.map(s => storage.getParticipant(s.participantId))
      );

      const results = {
        quiz,
        questions,
        participants: participants.filter(Boolean).map((p, i) => ({
          ...p,
          submission: submissions[i],
          score: submissions[i]?.score || 0
        })),
        stats: await storage.getQuizStats(quizId)
      };

      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch quiz results", error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

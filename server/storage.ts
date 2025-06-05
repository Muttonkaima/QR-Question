import { 
  quizzes, 
  questions, 
  participants, 
  submissions,
  type Quiz, 
  type Question, 
  type Participant, 
  type Submission,
  type InsertQuiz, 
  type InsertQuestion, 
  type InsertParticipant, 
  type InsertSubmission,
  type QuizWithQuestions,
  type LeaderboardEntry
} from "@shared/schema";

export interface IStorage {
  // Quiz management
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  getQuizByQrCode(qrCode: string): Promise<Quiz | undefined>;
  updateQuizQrCode(id: number, qrCode: string): Promise<Quiz | undefined>;
  getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined>;
  
  // Question management
  createQuestion(question: InsertQuestion): Promise<Question>;
  getQuestionsByQuizId(quizId: number): Promise<Question[]>;
  deleteQuestion(id: number): Promise<boolean>;
  updateQuestion(id: number, question: Partial<InsertQuestion>): Promise<Question | undefined>;
  
  // Participant management
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  getParticipant(id: number): Promise<Participant | undefined>;
  getParticipantByEmailAndQuiz(email: string, quizId: number): Promise<Participant | undefined>;
  
  // Submission management
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByQuiz(quizId: number): Promise<Submission[]>;
  getSubmissionByParticipant(participantId: number): Promise<Submission | undefined>;
  
  // Leaderboard
  getLeaderboard(quizId: number): Promise<LeaderboardEntry[]>;
  getQuizStats(quizId: number): Promise<{
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
  }>;
}

export class MemStorage implements IStorage {
  private quizzes: Map<number, Quiz>;
  private questions: Map<number, Question>;
  private participants: Map<number, Participant>;
  private submissions: Map<number, Submission>;
  private currentQuizId: number;
  private currentQuestionId: number;
  private currentParticipantId: number;
  private currentSubmissionId: number;

  constructor() {
    this.quizzes = new Map();
    this.questions = new Map();
    this.participants = new Map();
    this.submissions = new Map();
    this.currentQuizId = 1;
    this.currentQuestionId = 1;
    this.currentParticipantId = 1;
    this.currentSubmissionId = 1;
  }

  async createQuiz(insertQuiz: InsertQuiz): Promise<Quiz> {
    const id = this.currentQuizId++;
    const quiz: Quiz = {
      ...insertQuiz,
      id,
      qrCode: null,
      createdAt: new Date(),
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizByQrCode(qrCode: string): Promise<Quiz | undefined> {
    return Array.from(this.quizzes.values()).find(quiz => quiz.qrCode === qrCode);
  }

  async updateQuizQrCode(id: number, qrCode: string): Promise<Quiz | undefined> {
    const quiz = this.quizzes.get(id);
    if (quiz) {
      const updatedQuiz = { ...quiz, qrCode };
      this.quizzes.set(id, updatedQuiz);
      return updatedQuiz;
    }
    return undefined;
  }

  async getQuizWithQuestions(id: number): Promise<QuizWithQuestions | undefined> {
    const quiz = this.quizzes.get(id);
    if (!quiz) return undefined;
    
    const questions = await this.getQuestionsByQuizId(id);
    return { ...quiz, questions };
  }

  async createQuestion(insertQuestion: InsertQuestion): Promise<Question> {
    const id = this.currentQuestionId++;
    const question: Question = {
      ...insertQuestion,
      id,
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestionsByQuizId(quizId: number): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(question => question.quizId === quizId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  async updateQuestion(id: number, updateData: Partial<InsertQuestion>): Promise<Question | undefined> {
    const question = this.questions.get(id);
    if (question) {
      const updatedQuestion = { ...question, ...updateData };
      this.questions.set(id, updatedQuestion);
      return updatedQuestion;
    }
    return undefined;
  }

  async createParticipant(insertParticipant: InsertParticipant): Promise<Participant> {
    const id = this.currentParticipantId++;
    const participant: Participant = {
      ...insertParticipant,
      id,
      createdAt: new Date(),
    };
    this.participants.set(id, participant);
    return participant;
  }

  async getParticipant(id: number): Promise<Participant | undefined> {
    return this.participants.get(id);
  }

  async getParticipantByEmailAndQuiz(email: string, quizId: number): Promise<Participant | undefined> {
    return Array.from(this.participants.values()).find(
      participant => participant.email === email && participant.quizId === quizId
    );
  }

  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const id = this.currentSubmissionId++;
    const submission: Submission = {
      ...insertSubmission,
      id,
      submittedAt: new Date(),
    };
    this.submissions.set(id, submission);
    return submission;
  }

  async getSubmissionsByQuiz(quizId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values())
      .filter(submission => submission.quizId === quizId);
  }

  async getSubmissionByParticipant(participantId: number): Promise<Submission | undefined> {
    return Array.from(this.submissions.values())
      .find(submission => submission.participantId === participantId);
  }

  async getLeaderboard(quizId: number): Promise<LeaderboardEntry[]> {
    const submissions = await this.getSubmissionsByQuiz(quizId);
    const leaderboardEntries: LeaderboardEntry[] = [];

    for (const submission of submissions) {
      const participant = await this.getParticipant(submission.participantId);
      if (participant) {
        const accuracy = (submission.score / (submission.totalQuestions * 10)) * 100;
        leaderboardEntries.push({
          participantId: participant.id,
          name: participant.name,
          email: participant.email,
          score: submission.score,
          completionTime: submission.completionTime,
          rank: 0, // Will be set after sorting
          accuracy: Math.round(accuracy),
        });
      }
    }

    // Sort by score (descending), then by completion time (ascending)
    leaderboardEntries.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return a.completionTime - b.completionTime;
    });

    // Set ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return leaderboardEntries;
  }

  async getQuizStats(quizId: number): Promise<{
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
  }> {
    const submissions = await this.getSubmissionsByQuiz(quizId);
    
    if (submissions.length === 0) {
      return {
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
      };
    }

    const scores = submissions.map(s => s.score);
    const totalParticipants = submissions.length;
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    const highestScore = Math.max(...scores);

    return {
      totalParticipants,
      averageScore,
      highestScore,
    };
  }
}

export const storage = new MemStorage();

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, QrCode, Save, Eye, Download, X } from "lucide-react";
import { GamingCard, NeonButton, QuestionCard, StatCard } from "@/components/gaming-ui";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Quiz, Question } from "@shared/schema";
import type { QuizFormData, QuestionFormData } from "@/lib/types";

const quizSchema = z.object({
  title: z.string().min(1, "Quiz title is required"),
  timeLimit: z.number().min(1, "Time limit must be at least 1 minute"),
});

const questionSchema = z.object({
  type: z.string().min(1, "Question type is required"),
  questionText: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.any(),
  points: z.number().min(1, "Points must be at least 1"),
});

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qrCodeDialog, setQrCodeDialog] = useState<{ quiz: Quiz; url: string } | null>(null);

  const { data: quizzes = [] } = useQuery<Quiz[]>({
    queryKey: ["/api/quizzes"],
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"],
    enabled: !!selectedQuiz?.id,
  });

  const quizForm = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: "",
      timeLimit: 15,
    },
  });

  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      type: "multiple_choice",
      questionText: "",
      options: ["", "", "", ""],
      correctAnswer: [],
      points: 10,
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const res = await apiRequest("POST", "/api/quizzes", data);
      return res.json();
    },
    onSuccess: (quiz) => {
      toast({ title: "Quiz created successfully!" });
      setSelectedQuiz(quiz);
      setShowQuizCreator(true);
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes"] });
    },
    onError: () => {
      toast({ title: "Failed to create quiz", variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      if (!selectedQuiz) throw new Error("No quiz selected");
      
      const questionData = {
        ...data,
        quizId: selectedQuiz.id,
        order: questions.length + 1,
      };
      
      const res = await apiRequest("POST", "/api/questions", questionData);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Question added successfully!" });
      setShowQuestionForm(false);
      questionForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"] });
    },
    onError: () => {
      toast({ title: "Failed to add question", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/questions/${questionId}`);
    },
    onSuccess: () => {
      toast({ title: "Question deleted successfully!" });
      queryClient.invalidateQueries({ queryKey: ["/api/quizzes", selectedQuiz?.id, "questions"] });
    },
    onError: () => {
      toast({ title: "Failed to delete question", variant: "destructive" });
    },
  });

  const generateQRCode = async (quiz: Quiz) => {
    // Use a simple QR code service or library
    const baseUrl = window.location.origin;
    const quizUrl = `${baseUrl}/quiz/${quiz.id}/register`;
    
    // For this implementation, we'll use a public QR code API
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(quizUrl)}`;
    
    // Update quiz with QR code
    await apiRequest("POST", `/api/quizzes/${quiz.id}/qr-code`, { qrCode: qrCodeUrl });
    
    setQrCodeDialog({ quiz, url: qrCodeUrl });
    
    toast({ title: "QR Code generated successfully!" });
  };

  const onSubmitQuiz = (data: QuizFormData) => {
    createQuizMutation.mutate(data);
  };

  const onSubmitQuestion = (data: QuestionFormData) => {
    createQuestionMutation.mutate(data);
  };

  const watchedQuestionType = questionForm.watch("type");

  useEffect(() => {
    if (watchedQuestionType === "true_false") {
      questionForm.setValue("options", ["True", "False"]);
    } else if (watchedQuestionType === "multiple_choice") {
      questionForm.setValue("options", ["", "", "", ""]);
    } else {
      questionForm.setValue("options", undefined);
    }
  }, [watchedQuestionType, questionForm]);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <section className="text-center py-20">
          <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-6 animate-slide-up">
            <span className="bg-gradient-to-r from-cyber-blue via-neon-pink to-matrix-green bg-clip-text text-transparent">
              QUIZ CREATOR
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up">
            Design epic quizzes with our advanced gaming-themed platform. Create, share, and conquer!
          </p>
          
          {!selectedQuiz && (
            <Form {...quizForm}>
              <form onSubmit={quizForm.handleSubmit(onSubmitQuiz)}>
                <Dialog>
                  <DialogTrigger asChild>
                    <NeonButton className="animate-slide-up">
                      <Plus className="w-5 h-5 mr-2" />
                      CREATE NEW QUIZ
                    </NeonButton>
                  </DialogTrigger>
                  <DialogContent className="gaming-card text-white">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-orbitron text-cyber-blue">Create New Quiz</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <FormField
                        control={quizForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quiz Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter quiz title..."
                                className="bg-dark-tertiary border-cyan-500/30 focus:border-cyber-blue"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={quizForm.control}
                        name="timeLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Limit (minutes)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="15"
                                className="bg-dark-tertiary border-cyan-500/30 focus:border-cyber-blue"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <NeonButton type="submit" className="w-full" disabled={createQuizMutation.isPending}>
                        {createQuizMutation.isPending ? "Creating..." : "Create Quiz"}
                      </NeonButton>
                    </div>
                  </DialogContent>
                </Dialog>
              </form>
            </Form>
          )}
        </section>

        {/* Quiz List */}
        {!selectedQuiz && quizzes.length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-orbitron font-bold mb-6 text-center text-matrix-green">Your Quizzes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <GamingCard key={quiz.id} className="p-6 cursor-pointer hover:border-cyber-blue/50 transition-all" 
                           onClick={() => setSelectedQuiz(quiz)}>
                  <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">Time Limit: {quiz.timeLimit} minutes</p>
                  <div className="flex space-x-2">
                    <NeonButton 
                      size="sm" 
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { 
                        e.stopPropagation(); 
                        setSelectedQuiz(quiz); 
                        setShowQuizCreator(true); 
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Edit
                    </NeonButton>
                    <NeonButton 
                      variant="secondary" 
                      size="sm" 
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => { 
                        e.stopPropagation(); 
                        generateQRCode(quiz); 
                      }}
                    >
                      <QrCode className="w-4 h-4 mr-1" />
                      QR
                    </NeonButton>
                  </div>
                </GamingCard>
              ))}
            </div>
          </section>
        )}

        {/* Quiz Builder */}
        {selectedQuiz && (
          <section className="max-w-4xl mx-auto">
            {/* Quiz Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-orbitron font-bold text-cyber-blue">{selectedQuiz.title}</h2>
                <p className="text-gray-400">Time Limit: {selectedQuiz.timeLimit} minutes</p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Question Builder */}
            <GamingCard className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-orbitron font-bold text-matrix-green">Question Builder</h3>
                <NeonButton onClick={() => setShowQuestionForm(!showQuestionForm)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </NeonButton>
              </div>

              {showQuestionForm && (
                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-6 border-t border-cyan-500/30 pt-6">
                    <FormField
                      control={questionForm.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-tertiary border-cyan-500/30">
                                <SelectValue placeholder="Select question type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-dark-tertiary border-cyan-500/30">
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="questionText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Text</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your question here..."
                              className="bg-dark-tertiary border-cyan-500/30 focus:border-cyber-blue resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchedQuestionType === "multiple_choice" && (
                      <div className="space-y-4">
                        <Label>Answer Options</Label>
                        {questionForm.watch("options")?.map((_, index) => (
                          <div key={index} className="flex items-center space-x-4">
                            <input
                              type="checkbox"
                              className="text-cyber-blue"
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const currentAnswers = questionForm.getValues("correctAnswer") || [];
                                if (e.target.checked) {
                                  questionForm.setValue("correctAnswer", [...currentAnswers, index]);
                                } else {
                                  questionForm.setValue("correctAnswer", currentAnswers.filter((i: number) => i !== index));
                                }
                              }}
                            />
                            <Input
                              placeholder={`Option ${String.fromCharCode(65 + index)}`}
                              className="flex-1 bg-dark-tertiary border-cyan-500/30 focus:border-cyber-blue"
                              value={questionForm.watch("options")?.[index] || ""}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const options = questionForm.getValues("options") || [];
                                options[index] = e.target.value;
                                questionForm.setValue("options", options);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {watchedQuestionType === "true_false" && (
                      <FormField
                        control={questionForm.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "true")} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger className="bg-dark-tertiary border-cyan-500/30">
                                  <SelectValue placeholder="Select correct answer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-dark-tertiary border-cyan-500/30">
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchedQuestionType === "fill_blank" && (
                      <FormField
                        control={questionForm.control}
                        name="correctAnswer"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answer</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter the correct answer"
                                className="bg-dark-tertiary border-cyan-500/30 focus:border-cyber-blue"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="flex space-x-4">
                      <NeonButton type="submit" className="flex-1" disabled={createQuestionMutation.isPending}>
                        {createQuestionMutation.isPending ? "Adding..." : "Add Question"}
                      </NeonButton>
                      <NeonButton variant="secondary" type="button" onClick={() => setShowQuestionForm(false)}>
                        Cancel
                      </NeonButton>
                    </div>
                  </form>
                </Form>
              )}
            </GamingCard>

            {/* Questions List */}
            {questions.length > 0 && (
              <GamingCard className="p-6 mb-8">
                <h3 className="text-2xl font-orbitron font-bold mb-6 text-neon-orange">
                  Quiz Questions ({questions.length})
                </h3>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      index={index}
                      onEdit={() => setEditingQuestion(question)}
                      onDelete={() => deleteQuestionMutation.mutate(question.id)}
                    />
                  ))}
                </div>
              </GamingCard>
            )}

            {/* Quiz Actions */}
            {questions.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <NeonButton 
                  className="flex-1"
                  onClick={() => generateQRCode(selectedQuiz)}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  GENERATE QR CODE
                </NeonButton>
                <Link href={`/quiz/${selectedQuiz.id}/leaderboard`}>
                  <NeonButton variant="secondary">
                    <Eye className="w-4 h-4 mr-2" />
                    View Leaderboard
                  </NeonButton>
                </Link>
              </div>
            )}
          </section>
        )}

        {/* QR Code Dialog */}
        {qrCodeDialog && (
          <Dialog open={!!qrCodeDialog} onOpenChange={() => setQrCodeDialog(null)}>
            <DialogContent className="gaming-card text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="text-2xl font-orbitron text-cyber-blue">Quiz QR Code</DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-6">
                <div className="bg-white p-6 rounded-lg mx-auto w-fit">
                  <img src={qrCodeDialog.url} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-gray-300 text-sm">Players can scan this code to join the quiz</p>
                <div className="flex space-x-4">
                  <NeonButton className="flex-1" onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeDialog.url;
                    link.download = `${qrCodeDialog.quiz.title}-qr-code.png`;
                    link.click();
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </NeonButton>
                  <NeonButton variant="secondary" onClick={() => setQrCodeDialog(null)}>
                    Close
                  </NeonButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

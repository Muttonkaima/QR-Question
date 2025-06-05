import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertQuizSchema, insertQuestionSchema } from "@shared/schema";
import { Plus, Gamepad2, Settings, Trophy, Save, Eye, QrCode, Download, Edit, Trash } from "lucide-react";
import { Link } from "wouter";
import GamingCard from "@/components/ui/gaming-card";

const quizFormSchema = insertQuizSchema;
const questionFormSchema = insertQuestionSchema.extend({
  options: z.array(z.string()).optional(),
});

export default function AdminPanel() {
  const { toast } = useToast();
  const [showQuizCreator, setShowQuizCreator] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [qrCodeData, setQRCodeData] = useState<{ qrCode: string; qrCodeDataUrl: string } | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  const quizForm = useForm<z.infer<typeof quizFormSchema>>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      timeLimit: 15,
      isActive: true,
    },
  });

  const questionForm = useForm<z.infer<typeof questionFormSchema>>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionText: "",
      questionType: "multiple_choice",
      options: ["", ""],
      correctAnswer: "",
      points: 10,
      orderIndex: 0,
    },
  });

  const createQuizMutation = useMutation({
    mutationFn: async (data: z.infer<typeof quizFormSchema>) => {
      const response = await apiRequest("POST", "/api/quizzes", data);
      return response.json();
    },
    onSuccess: (quiz) => {
      setCurrentQuiz(quiz);
      setShowQuizCreator(true);
      toast({ title: "Success", description: "Quiz created successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof questionFormSchema>) => {
      const response = await apiRequest("POST", "/api/questions", {
        ...data,
        quizId: currentQuiz.id,
        orderIndex: questions.length,
      });
      return response.json();
    },
    onSuccess: (question) => {
      setQuestions([...questions, question]);
      questionForm.reset();
      toast({ title: "Success", description: "Question added successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const generateQRMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/quizzes/${currentQuiz.id}/qr-code`);
      return response.json();
    },
    onSuccess: (data) => {
      setQRCodeData(data);
      setShowQRCode(true);
      toast({ title: "Success", description: "QR Code generated successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (questionId: number) => {
      const response = await apiRequest("DELETE", `/api/questions/${questionId}`);
      return response.json();
    },
    onSuccess: (_, questionId) => {
      setQuestions(questions.filter(q => q.id !== questionId));
      toast({ title: "Success", description: "Question deleted successfully!" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmitQuiz = (data: z.infer<typeof quizFormSchema>) => {
    createQuizMutation.mutate(data);
  };

  const onSubmitQuestion = (data: z.infer<typeof questionFormSchema>) => {
    createQuestionMutation.mutate(data);
  };

  const questionType = questionForm.watch("questionType");

  return (
    <div className="min-h-screen text-white">
      {/* Navigation */}
      <nav className="relative z-50 bg-dark-secondary/80 backdrop-blur-lg border-b border-cyan-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-green-400 rounded-lg flex items-center justify-center">
                <Gamepad2 className="text-xl" />
              </div>
              <span className="text-2xl font-orbitron font-bold bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                GameQuiz Pro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400">
                <Settings className="mr-2 h-4 w-4" />
                Admin Panel
              </Button>
              <Link href="/quiz/demo/leaderboard">
                <Button variant="ghost" className="text-gray-300 hover:text-green-400">
                  <Trophy className="mr-2 h-4 w-4" />
                  Leaderboards
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {!showQuizCreator ? (
        // Hero Section
        <section className="relative py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-6 animate-slide-up">
              <span className="bg-gradient-to-r from-cyan-400 via-pink-500 to-green-400 bg-clip-text text-transparent">
                QUIZ CREATOR
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.2s'}}>
              Design epic quizzes with our advanced gaming-themed platform. Create, share, and conquer!
            </p>
            <Form {...quizForm}>
              <form onSubmit={quizForm.handleSubmit(onSubmitQuiz)} className="max-w-md mx-auto space-y-4">
                <FormField
                  control={quizForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input 
                          placeholder="Enter quiz title..." 
                          className="bg-dark-tertiary border-cyan-500/30 text-white"
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
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Time limit (minutes)" 
                          className="bg-dark-tertiary border-cyan-500/30 text-white"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="neon-button w-full py-4 text-lg font-orbitron"
                  disabled={createQuizMutation.isPending}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  CREATE NEW QUIZ
                </Button>
              </form>
            </Form>
          </div>
        </section>
      ) : (
        // Quiz Creator Interface
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            {/* Quiz Header */}
            <GamingCard className="p-6 mb-8">
              <h2 className="text-3xl font-orbitron font-bold mb-6 text-cyan-400">Quiz Configuration</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Quiz Title</label>
                  <div className="text-lg font-medium text-white">{currentQuiz?.title}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">Time Limit</label>
                  <div className="text-lg font-medium text-white">{currentQuiz?.timeLimit} minutes</div>
                </div>
              </div>
            </GamingCard>

            {/* Question Creator */}
            <GamingCard className="p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-orbitron font-bold text-green-400">Question Builder</h3>
              </div>

              <Form {...questionForm}>
                <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={questionForm.control}
                      name="questionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Question Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-dark-tertiary border-cyan-500/30">
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                              <SelectItem value="true_false">True/False</SelectItem>
                              <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                              <SelectItem value="reorder">Reordering (Drag & Drop)</SelectItem>
                              <SelectItem value="sort">Sorting</SelectItem>
                              <SelectItem value="match">Match the Following</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={questionForm.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300">Points</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              className="bg-dark-tertiary border-cyan-500/30 text-white"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={questionForm.control}
                    name="questionText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Question Text</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter your question here..."
                            className="bg-dark-tertiary border-cyan-500/30 text-white h-24 resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {questionType === "multiple_choice" && (
                    <div className="space-y-4">
                      <FormLabel className="text-gray-300">Options</FormLabel>
                      {questionForm.watch("options")?.map((_, index) => (
                        <div key={index} className="flex items-center space-x-4">
                          <FormField
                            control={questionForm.control}
                            name={`options.${index}`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormControl>
                                  <Input 
                                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                    className="bg-dark-tertiary border-cyan-500/30 text-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const options = questionForm.getValues("options") || [];
                              options.splice(index, 1);
                              questionForm.setValue("options", options);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const options = questionForm.getValues("options") || [];
                          questionForm.setValue("options", [...options, ""]);
                        }}
                        className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Option
                      </Button>
                    </div>
                  )}

                  <FormField
                    control={questionForm.control}
                    name="correctAnswer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-300">Correct Answer</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the correct answer..."
                            className="bg-dark-tertiary border-cyan-500/30 text-white"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button 
                      type="submit"
                      className="neon-button flex-1"
                      disabled={createQuestionMutation.isPending}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                </form>
              </Form>
            </GamingCard>

            {/* Questions List */}
            {questions.length > 0 && (
              <GamingCard className="p-6 mb-8">
                <h3 className="text-2xl font-orbitron font-bold mb-6 text-orange-400">Quiz Questions ({questions.length})</h3>
                
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="question-card rounded-lg p-4 transition-all duration-300 hover:shadow-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-cyan-400 text-black px-3 py-1 rounded-full text-sm font-bold">Q{index + 1}</span>
                            <span className={`px-3 py-1 rounded-full text-sm ${
                              question.questionType === 'multiple_choice' ? 'bg-green-400/20 text-green-400' :
                              question.questionType === 'true_false' ? 'bg-orange-400/20 text-orange-400' :
                              'bg-pink-400/20 text-pink-400'
                            }`}>
                              {question.questionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          <h4 className="text-lg font-medium mb-2">{question.questionText}</h4>
                          {question.options && (
                            <div className="text-sm text-gray-400 space-y-1">
                              {question.options.map((option: string, optIndex: number) => (
                                <div key={optIndex} className={option === question.correctAnswer ? 'text-green-400' : ''}>
                                  {String.fromCharCode(65 + optIndex)}) {option} {option === question.correctAnswer && '✓'}
                                </div>
                              ))}
                            </div>
                          )}
                          {!question.options && (
                            <div className="text-sm text-gray-400">
                              <div className="text-green-400">Answer: {question.correctAnswer} ✓</div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-cyan-400 hover:text-blue-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-pink-400 hover:text-red-400"
                            onClick={() => deleteQuestionMutation.mutate(question.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GamingCard>
            )}

            {/* Quiz Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="neon-button flex-1 py-4 font-orbitron text-lg"
                onClick={() => generateQRMutation.mutate()}
                disabled={questions.length === 0 || generateQRMutation.isPending}
              >
                <QrCode className="mr-2 h-5 w-5" />
                GENERATE QR CODE
              </Button>
              <Button 
                variant="outline"
                className="bg-dark-tertiary border-cyan-500/30 hover:border-cyan-400 text-white py-4 px-8"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Draft
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* QR Code Display Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="gaming-card max-w-md text-center border-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-orbitron font-bold text-cyan-400">Quiz QR Code</DialogTitle>
          </DialogHeader>
          {qrCodeData && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg mx-auto w-fit">
                <img src={qrCodeData.qrCodeDataUrl} alt="Quiz QR Code" className="w-48 h-48" />
              </div>
              <p className="text-gray-300 text-sm">Players can scan this code to join the quiz</p>
              <div className="flex space-x-4">
                <Button 
                  className="neon-button flex-1"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = qrCodeData.qrCodeDataUrl;
                    link.download = 'quiz-qr-code.png';
                    link.click();
                  }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  className="bg-dark-tertiary border-cyan-500/30 text-white"
                  onClick={() => setShowQRCode(false)}
                >
                  Close
                </Button>
              </div>
              <div className="text-sm text-gray-400">
                Quiz URL: {window.location.origin}/quiz/{qrCodeData.qrCode}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

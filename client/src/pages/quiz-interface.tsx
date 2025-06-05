import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, ArrowLeft, ArrowRight, Bookmark, Flag } from "lucide-react";
import GamingCard from "@/components/ui/gaming-card";

export default function QuizInterface() {
  const { qrCode, participantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime] = useState(Date.now());

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: [`/api/quizzes/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  const { data: quizWithQuestions } = useQuery({
    queryKey: [`/api/quizzes/${quiz?.id}`],
    enabled: !!quiz?.id,
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      const completionTime = Math.floor((Date.now() - startTime) / 1000);
      
      // Calculate score
      let score = 0;
      quizWithQuestions.questions.forEach((question: any) => {
        const userAnswer = answers[question.id];
        if (userAnswer && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          score += question.points;
        }
      });

      const submissionData = {
        participantId: parseInt(participantId!),
        quizId: quiz.id,
        answers: JSON.stringify(answers),
        score,
        totalQuestions: quizWithQuestions.questions.length,
        completionTime,
      };

      const response = await apiRequest("POST", "/api/submissions", submissionData);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quiz submitted successfully!" });
      setLocation(`/quiz/${qrCode}/results/${participantId}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!quiz) return;

    const totalTimeInSeconds = quiz.timeLimit * 60;
    setTimeRemaining(totalTimeInSeconds);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          submitQuizMutation.mutate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz]);

  if (quizLoading || !quizWithQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  const currentQuestion = quizWithQuestions.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quizWithQuestions.questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleAnswerSelect = (answer: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: answer });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizWithQuestions.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitQuizMutation.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Quiz Header */}
      <div className="bg-dark-secondary/90 backdrop-blur-lg border-b border-cyan-500/30 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-orbitron font-bold">
                Question <span className="text-cyan-400">{currentQuestionIndex + 1}</span> of <span className="text-green-400">{quizWithQuestions.questions.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-400">Time Remaining</div>
                <div className="text-xl font-bold text-orange-400 font-orbitron">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-pink-400 hover:text-red-400"
                onClick={() => setLocation('/')}
              >
                <X className="text-xl" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-dark-tertiary rounded-full h-2">
              <div 
                className="progress-bar h-2 rounded-full transition-all duration-500" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz Content */}
      <section className="py-8 px-4 min-h-screen">
        <div className="container mx-auto max-w-4xl">
          {/* Question Card */}
          <GamingCard className="p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-relaxed">
                {currentQuestion.questionText}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className={`px-3 py-1 rounded-full ${
                  currentQuestion.questionType === 'multiple_choice' ? 'bg-cyan-400/20 text-cyan-400' :
                  currentQuestion.questionType === 'true_false' ? 'bg-orange-400/20 text-orange-400' :
                  'bg-pink-400/20 text-pink-400'
                }`}>
                  {currentQuestion.questionType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </span>
                <span>Points: <span className="text-green-400 font-bold">{currentQuestion.points}</span></span>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-4">
              {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options ? (
                currentQuestion.options.map((option: string, index: number) => (
                  <label key={index} className="block cursor-pointer">
                    <div className={`gaming-card rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] group ${
                      answers[currentQuestion.id] === option ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.3)]' : ''
                    }`}>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="radio" 
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          className="w-5 h-5 text-cyan-400"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className="bg-cyan-400 text-black px-3 py-1 rounded-full text-sm font-bold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-lg">{option}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              ) : currentQuestion.questionType === 'true_false' ? (
                ['True', 'False'].map((option, index) => (
                  <label key={option} className="block cursor-pointer">
                    <div className={`gaming-card rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] group ${
                      answers[currentQuestion.id] === option ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.3)]' : ''
                    }`}>
                      <div className="flex items-center space-x-4">
                        <input 
                          type="radio" 
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={(e) => handleAnswerSelect(e.target.value)}
                          className="w-5 h-5 text-cyan-400"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                              option === 'True' ? 'bg-green-400 text-black' : 'bg-red-400 text-black'
                            }`}>
                              {option}
                            </span>
                            <span className="text-lg">{option}</span>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ArrowRight className="text-cyan-400" />
                        </div>
                      </div>
                    </div>
                  </label>
                ))
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    className="w-full bg-dark-tertiary border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </GamingCard>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline"
              className="bg-dark-tertiary border-cyan-500/30 hover:border-cyan-400 text-white"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex space-x-4">
              <Button 
                variant="outline"
                className="bg-orange-400/20 border-orange-400/30 hover:bg-orange-400/30 text-orange-400"
              >
                <Bookmark className="mr-2 h-4 w-4" />
                Flag
              </Button>
              <Button 
                className="neon-button py-3 px-8 font-orbitron"
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || submitQuizMutation.isPending}
              >
                {currentQuestionIndex === quizWithQuestions.questions.length - 1 ? 'SUBMIT' : 'NEXT'}
                {currentQuestionIndex < quizWithQuestions.questions.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

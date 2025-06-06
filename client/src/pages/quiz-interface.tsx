import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, ArrowLeft, ArrowRight, Bookmark, Flag, Trophy } from "lucide-react";
import GamingCard from "@/components/ui/gaming-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Quiz {
  id: number;
  title: string;
  timeLimit: number;
  isActive: boolean;
  qrCode?: string;
  questions?: Question[];
}

interface Question {
  id: number;
  quizId: number;
  questionText: string;
  questionType: string;
  options: string[] | null;
  correctAnswer: string;
  points: number;
  orderIndex: number;
}

interface LeaderboardEntry {
  participantId: number;
  name: string;
  email: string;
  score: number;
  timeSpent: number;
  rank: number;
  accuracy: number;
}

export default function QuizInterface() {
  const { qrCode, participantId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime] = useState(Date.now());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const queryClient = useQueryClient();

  const { data: quiz, isLoading: quizLoading } = useQuery<Quiz>({
    queryKey: [`/api/quizzes/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  const { data: quizWithQuestions } = useQuery<Quiz>({
    queryKey: quiz?.id ? [`/api/quizzes/${quiz.id}`] : [],
    enabled: !!quiz?.id,
  });
  
  const quizId = quiz?.id;

  // Fetch leaderboard data
  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: quizId ? [`/api/quizzes/${quizId}/leaderboard`] : [],
    enabled: !!quizId,
    refetchInterval: 2000, // Refresh every 2 seconds
  });

  // Mutation for submitting individual answers
  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionId, isCorrect, points }: { questionId: number; isCorrect: boolean; points: number }) => {
      if (!quizId) throw new Error('Quiz ID is missing');
      if (!participantId) throw new Error('Participant ID is missing');
      
      return apiRequest("POST", "/api/submit-answer", {
        participantId: parseInt(participantId),
        quizId,
        questionId,
        isCorrect,
        points,
      });
    },
    onSuccess: () => {
      // Invalidate leaderboard query to trigger refetch
      if (quizId) {
        queryClient.invalidateQueries({ queryKey: [`/api/quizzes/${quizId}/leaderboard`] });
      }
    },
  });

  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!quiz || !quizWithQuestions?.questions) {
        throw new Error('Quiz data is not loaded');
      }
      
      const completionTime = Math.floor((Date.now() - startTime) / 1000);
      
      // Calculate score from answers already submitted
      let score = 0;
      const questionMap = new Map(quizWithQuestions.questions.map(q => [q.id, q]));
      
      Object.entries(answers).forEach(([questionId, userAnswer]) => {
        const question = questionMap.get(parseInt(questionId));
        if (question && userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
          score += question.points || 10;
        }
      });

      // Get the current submission to ensure we update it rather than create a new one
      let currentSubmission = null;
      try {
        const currentSubmissionResponse = await apiRequest("GET", `/api/participants/${participantId}/submission`);
        if (currentSubmissionResponse.ok) {
          currentSubmission = await currentSubmissionResponse.json();
          console.log('Current submission:', currentSubmission);
        } else {
          const errorText = await currentSubmissionResponse.text();
          console.warn('No existing submission found, will create new one. Response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching current submission:', error);
      }
      
      const submissionData = {
        participantId: parseInt(participantId!),
        quizId: quiz.id,
        answers: JSON.stringify(answers),
        score,
        totalQuestions: quizWithQuestions.questions.length,
        completionTime,
      };
      
      console.log('Submitting with data:', submissionData);

      if (currentSubmission) {
        // Update existing submission
        const response = await apiRequest("PUT", "/api/submissions", {
          ...submissionData,
          id: currentSubmission.id
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update submission: ${errorText}`);
        }
        return await response.json();
      } else {
        // Create new submission (shouldn't happen in normal flow)
        const response = await apiRequest("POST", "/api/submissions", submissionData);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create submission: ${errorText}`);
        }
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Quiz submitted successfully!" });
      if (qrCode) {
        setLocation(`/quiz/${qrCode}/results/${participantId}`);
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || 'Failed to submit quiz', 
        variant: "destructive" 
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (!quiz) return;

    const totalTimeInSeconds = (quiz.timeLimit || 10) * 60; // Default to 10 minutes if not set
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
  }, [quiz, submitQuizMutation]);

  if (quizLoading || !quizWithQuestions || !quizWithQuestions.questions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  const questions = quizWithQuestions.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">No questions found in this quiz.</div>
      </div>
    );
  }

  const progress = ((currentQuestionIndex + 1) / Math.max(1, questions.length)) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const handleAnswerSelect = async (answer: string) => {
    if (!currentQuestion) return;
    
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    // Update local state
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));
    
    // Submit answer to server
    try {
      await submitAnswerMutation.mutateAsync({
        questionId: currentQuestion.id,
        isCorrect,
        points: currentQuestion.points || 10,
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  const handleNext = () => {
    if (!quizWithQuestions?.questions) return;
    
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
  
  const isLastQuestion = quizWithQuestions?.questions ? 
    currentQuestionIndex === quizWithQuestions.questions.length - 1 : false;
  const isFirstQuestion = currentQuestionIndex === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary to-dark-secondary text-white">
      {/* Leaderboard Toggle Button */}
      <button 
        onClick={() => setShowLeaderboard(!showLeaderboard)}
        className="fixed right-4 top-4 z-50 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full p-3 shadow-lg transition-all duration-300 flex items-center gap-2"
      >
        <Trophy className="w-6 h-6" />
        <span className="font-bold hidden sm:inline">{showLeaderboard ? 'Hide' : 'Show'} Leaderboard</span>
      </button>
      
      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div className="fixed right-4 top-20 z-40 w-80 bg-dark-secondary/95 backdrop-blur-md rounded-lg shadow-xl border border-cyan-500/30 overflow-hidden">
          <div className="p-4 bg-cyan-900/80 text-white font-bold flex justify-between items-center border-b border-cyan-500/30">
            <h3 className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Live Leaderboard
            </h3>
            <button 
              onClick={() => setShowLeaderboard(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-4 space-y-2">
              {leaderboard.slice(0, 10).map((entry, index) => (
                <div 
                  key={entry.participantId} 
                  className={`p-3 rounded-lg flex justify-between items-center transition-all ${
                    participantId && entry.participantId === parseInt(participantId)
                      ? 'bg-cyan-900/50 border border-cyan-400/50 shadow-lg scale-[1.02]' 
                      : 'bg-gray-800/50 hover:bg-gray-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-700' : 'bg-gray-700'
                    }`}>
                      <span className="font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="max-w-[180px] truncate">
                      <div className="font-medium truncate">
                        {entry.name} {participantId && entry.participantId === parseInt(participantId) && 
                          <span className="text-cyan-300 text-xs ml-1">(You)</span>}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{entry.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{entry.score}</div>
                    <div className="text-xs text-gray-400">{Math.round(entry.accuracy)}%</div>
                  </div>
                </div>
              ))}
              {leaderboard.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <Trophy className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p>Leaderboard will update as participants answer questions</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Quiz Header */}
      <div className="bg-dark-secondary/90 backdrop-blur-lg border-b border-cyan-500/30 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-orbitron font-bold">
                Question <span className="text-cyan-400">{currentQuestionIndex + 1}</span> of <span className="text-green-400">{quizWithQuestions.questions.length}</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                className="text-cyan-400 border-cyan-400/50 hover:bg-cyan-900/30 hover:text-cyan-300 hidden sm:flex items-center gap-1"
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                <Trophy className="w-4 h-4" />
                <span>{showLeaderboard ? 'Hide' : 'Show'} Leaderboard</span>
              </Button>
              <div className="text-right bg-gray-800/50 px-3 py-1 rounded-lg">
                <div className="text-xs text-gray-400">Time Remaining</div>
                <div className="text-lg font-bold text-orange-400 font-orbitron">
                  {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-pink-400 hover:text-red-400"
                onClick={() => setLocation('/')}
              >
                <X className="w-5 h-5" />
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
              ) : currentQuestion.questionType === 'reorder' && currentQuestion.options ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">Drag and drop to reorder the items:</div>
                  {currentQuestion.options.map((option: string, index: number) => (
                    <div key={index} className="gaming-card rounded-lg p-4 cursor-move hover:shadow-[0_0_20px_rgba(0,212,255,0.2)]">
                      <div className="flex items-center space-x-3">
                        <span className="text-cyan-400 text-xl">⋮⋮</span>
                        <span className="text-lg">{option}</span>
                      </div>
                    </div>
                  ))}
                  <input
                    type="hidden"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                  />
                </div>
              ) : currentQuestion.questionType === 'sort' && currentQuestion.options ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">Sort the items in the correct order:</div>
                  {currentQuestion.options.map((option: string, index: number) => (
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
                            <span className="text-lg">{option}</span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : currentQuestion.questionType === 'match' && currentQuestion.options ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-4">Match the items from left to right:</div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-cyan-400 font-bold">Items</h4>
                      {currentQuestion.options.slice(0, Math.ceil(currentQuestion.options.length / 2)).map((option: string, index: number) => (
                        <div key={index} className="gaming-card rounded-lg p-3">
                          <span className="text-lg">{option}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-green-400 font-bold">Matches</h4>
                      {currentQuestion.options.slice(Math.ceil(currentQuestion.options.length / 2)).map((option: string, index: number) => (
                        <label key={index} className="block cursor-pointer">
                          <div className={`gaming-card rounded-lg p-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] ${
                            answers[currentQuestion.id] === option ? 'border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.3)]' : ''
                          }`}>
                            <div className="flex items-center space-x-3">
                              <input 
                                type="radio" 
                                name={`question-${currentQuestion.id}`}
                                value={option}
                                checked={answers[currentQuestion.id] === option}
                                onChange={(e) => handleAnswerSelect(e.target.value)}
                                className="w-4 h-4 text-cyan-400"
                              />
                              <span className="text-lg">{option}</span>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Type your answer here..."
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    className="w-full bg-dark-tertiary border border-cyan-500/30 rounded-lg px-4 py-3 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-colors"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-full h-8 w-8 p-0 flex items-center justify-center border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentQuestionIndex(0)}
                  disabled={isFirstQuestion}
                  title="First Question"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 bg-transparent border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={!answers[currentQuestion.id] || submitQuizMutation.isPending}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submitQuizMutation.isPending ? (
                    'Submitting...'
                  ) : isLastQuestion ? (
                    'Submit Quiz'
                  ) : (
                    'Next'
                  )}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-full h-8 w-8 p-0 flex items-center justify-center border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (quizWithQuestions?.questions) {
                      setCurrentQuestionIndex(quizWithQuestions.questions.length - 1);
                    }
                  }}
                  disabled={isLastQuestion}
                  title="Last Question"
                >
                  »
                </Button>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-6 text-center">
              <div className="text-sm text-gray-400 mb-1">
                Question {currentQuestionIndex + 1} of {quizWithQuestions?.questions?.length || '?'}
              </div>
              <div className="w-full bg-dark-tertiary/50 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </GamingCard>
        </div>
      </section>
    </div>
  );
}

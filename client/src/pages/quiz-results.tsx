import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Share, Download } from "lucide-react";
import GamingCard from "@/components/ui/gaming-card";

export default function QuizResults() {
  const { qrCode, participantId } = useParams();

  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: [`/api/participants/${participantId}/submission`],
    enabled: !!participantId,
  });

  const { data: quiz } = useQuery({
    queryKey: [`/api/quizzes/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  const { data: leaderboard } = useQuery({
    queryKey: [`/api/quizzes/${quiz?.id}/leaderboard`],
    enabled: !!quiz?.id,
  });

  if (submissionLoading || !submission) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    );
  }

  const userRank = leaderboard?.find((entry: any) => entry.participantId === parseInt(participantId!))?.rank || 0;
  const totalParticipants = leaderboard?.length || 0;
  const accuracy = Math.round((submission.score / (submission.totalQuestions * 10)) * 100);
  const correctAnswers = Math.round(submission.score / 10);
  const incorrectAnswers = submission.totalQuestions - correctAnswers;
  const averageTime = Math.round(submission.completionTime / submission.totalQuestions);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        {/* Score Display */}
        <div className="mb-12">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-orbitron font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-green-400 bg-clip-text text-transparent">
                QUIZ COMPLETE!
              </span>
            </h1>
            <div className="text-6xl md:text-8xl font-orbitron font-black mb-6 animate-counter">
              <span className="text-orange-400">{submission.score}</span>
              <span className="text-gray-400 text-4xl">/{submission.totalQuestions * 10}</span>
            </div>
            <div className="text-2xl text-gray-300 mb-2">
              Rank: <span className="text-cyan-400 font-bold">#{userRank}</span> out of <span className="text-green-400">{totalParticipants}</span>
            </div>
            <div className="text-lg text-gray-400">
              Time: <span className="text-pink-400">{formatTime(submission.completionTime)}</span> | 
              Accuracy: <span className="text-green-400">{accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Performance Breakdown */}
        <GamingCard className="p-8 mb-8 text-left">
          <h2 className="text-2xl font-orbitron font-bold mb-6 text-center text-cyan-400">Performance Breakdown</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{correctAnswers}</div>
              <div className="text-gray-400">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">{incorrectAnswers}</div>
              <div className="text-gray-400">Incorrect Answers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{averageTime}s</div>
              <div className="text-gray-400">Avg. Time/Question</div>
            </div>
          </div>
        </GamingCard>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link href={`/quiz/${qrCode}/leaderboard`}>
            <Button className="neon-button py-4 px-8 font-orbitron w-full sm:w-auto">
              <Trophy className="mr-2 h-5 w-5" />
              VIEW LEADERBOARD
            </Button>
          </Link>
          <Button 
            variant="outline"
            className="bg-dark-tertiary border-cyan-500/30 hover:border-cyan-400 text-white py-4 px-8"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Retake Quiz
          </Button>
          <Button 
            className="bg-pink-500 hover:bg-pink-600 text-white py-4 px-8 transition-colors"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: `I scored ${submission.score}/${submission.totalQuestions * 10} on ${quiz?.title}!`,
                  text: `Check out my quiz results - I ranked #${userRank} out of ${totalParticipants} participants!`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Results link copied to clipboard!');
              }
            }}
          >
            <Share className="mr-2 h-5 w-5" />
            Share Results
          </Button>
        </div>

        {/* Quiz Info */}
        <div className="text-center text-gray-400">
          <p className="text-lg font-medium text-white mb-2">{quiz?.title}</p>
          <p>Completed in {formatTime(submission.completionTime)} out of {quiz?.timeLimit} minutes</p>
        </div>
      </div>
    </div>
  );
}

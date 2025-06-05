import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { queryClient } from "@/lib/queryClient";
import { Trophy, Download, ArrowLeft, Circle, Crown, Medal, Award } from "lucide-react";
import GamingCard from "@/components/ui/gaming-card";

export default function Leaderboard() {
  const { qrCode } = useParams();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const { data: quiz } = useQuery({
    queryKey: [`/api/quizzes/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: [`/api/quizzes/${quiz?.id}/leaderboard`],
    enabled: !!quiz?.id,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: [`/api/quizzes/${quiz?.id}/stats`],
    enabled: !!quiz?.id,
    refetchInterval: 5000,
  });

  // Update last update time
  useEffect(() => {
    if (leaderboard) {
      setLastUpdate(new Date());
    }
  }, [leaderboard]);

  const handleExport = async () => {
    if (!quiz?.id) return;
    
    try {
      const response = await fetch(`/api/quizzes/${quiz.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${quiz.id}-results.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  if (leaderboardLoading || !leaderboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Link href={`/quiz/${qrCode}`}>
              <Button variant="ghost" className="text-gray-300 hover:text-cyan-400">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Quiz
              </Button>
            </Link>
          </div>
          <h1 className="text-5xl md:text-6xl font-orbitron font-black mb-4">
            <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
              LEADERBOARD
            </span>
          </h1>
          <p className="text-xl text-gray-300">Top performers in the arena</p>
          <p className="text-lg text-cyan-400 mt-2">{quiz?.title}</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <GamingCard className="p-6 text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-2">{stats.totalParticipants}</div>
              <div className="text-gray-400">Total Players</div>
            </GamingCard>
            <GamingCard className="p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">{stats.averageScore}</div>
              <div className="text-gray-400">Average Score</div>
            </GamingCard>
            <GamingCard className="p-6 text-center">
              <div className="text-3xl font-bold text-orange-400 mb-2">{stats.highestScore}</div>
              <div className="text-gray-400">Highest Score</div>
            </GamingCard>
          </div>
        )}

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <GamingCard className="p-8 mb-8">
            <h2 className="text-2xl font-orbitron font-bold mb-8 text-center text-cyan-400">Hall of Champions</h2>
            <div className="grid md:grid-cols-3 gap-6">
             

              {/* 1st Place */}
              {topThree[0] && (
                <div className="text-center order-1 md:order-2">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full mx-auto flex items-center justify-center text-3xl font-bold animate-float">
                      1
                    </div>
                    <div className="absolute -top-2 -right-2 text-3xl">
                      <Crown className="h-10 w-10 text-yellow-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{topThree[0].name}</h3>
                  <div className="text-gray-400 text-sm mb-2 truncate">{topThree[0].email}</div>
                  <div className="text-3xl font-bold text-yellow-400">{topThree[0].score}</div>
                  {topThree[0].score === stats?.highestScore && (
                    <div className="text-sm text-green-400 mt-1">Perfect Score!</div>
                  )}
                </div>
              )}

                {/* 2nd Place */}
              {topThree[1] && (
                <div className="text-center order-2 md:order-1">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-float" style={{animationDelay: '0.2s'}}>
                      2
                    </div>
                    <div className="absolute -top-2 -right-2 text-2xl">
                      <Medal className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{topThree[1].name}</h3>
                  <div className="text-gray-400 text-sm mb-2 truncate">{topThree[1].email}</div>
                  <div className="text-2xl font-bold text-gray-400">{topThree[1].score}</div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="text-center order-3 md:order-3">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-600 to-yellow-800 rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-float" style={{animationDelay: '0.4s'}}>
                      3
                    </div>
                    <div className="absolute -top-2 -right-2 text-2xl">
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-1">{topThree[2].name}</h3>
                  <div className="text-gray-400 text-sm mb-2 truncate">{topThree[2].email}</div>
                  <div className="text-2xl font-bold text-yellow-600">{topThree[2].score}</div>
                </div>
              )}

             
            </div>
          </GamingCard>
        )}

        {/* Full Leaderboard */}
        <GamingCard className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-orbitron font-bold text-green-400">Full Rankings</h2>
            <Button 
              variant="ghost"
              className="text-cyan-400 hover:text-blue-400"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-400 flex items-center">
              <Circle className="h-2 w-2 text-green-400 mr-2 animate-pulse" />
              Live updates enabled
            </div>
            <div className="text-sm text-gray-400">
              Last updated: {getTimeAgo(lastUpdate)}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-500/30">
                  <th className="text-left py-3 px-4 font-orbitron">Rank</th>
                  <th className="text-left py-3 px-4 font-orbitron">Player</th>
                  <th className="text-center py-3 px-4 font-orbitron hidden sm:table-cell">Time</th>
                  <th className="text-center py-3 px-4 font-orbitron hidden md:table-cell">Accuracy</th>
                  <th className="text-right py-3 px-4 font-orbitron">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry: any, index: number) => {
                  const isTopThree = index < 3;
                  const rankColor = index === 0 ? 'text-yellow-400' : 
                                  index === 1 ? 'text-gray-400' : 
                                  index === 2 ? 'text-yellow-600' : 'text-cyan-400';
                  
                  return (
                    <tr key={entry.participantId} className={`leaderboard-row border-b border-cyan-500/10 transition-all duration-300 ${isTopThree ? 'bg-cyan-400/5' : ''}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg font-bold ${rankColor}`}>{entry.rank}</span>
                          {index < 3 && (
                            <div className="text-xs">
                              {index === 0 && <Crown className="h-4 w-4 text-yellow-400" />}
                              {index === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                              {index === 2 && <Award className="h-4 w-4 text-yellow-600" />}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <div className={`font-medium ${isTopThree ? 'text-cyan-400' : 'text-white'}`}>{entry.name}</div>
                          <div className="text-sm text-gray-400 truncate max-w-[200px]">{entry.email}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center hidden sm:table-cell">
                        <span className="text-orange-400">{formatTime(entry.completionTime)}</span>
                      </td>
                      <td className="py-4 px-4 text-center hidden md:table-cell">
                        <span className="text-green-400">{entry.accuracy}%</span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`text-2xl font-bold ${isTopThree ? rankColor : 'text-white'}`}>{entry.score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {remaining.length === 0 && leaderboard.length > 0 && (
            <div className="mt-6 text-center text-gray-400">
              <p>All participants displayed</p>
            </div>
          )}
        </GamingCard>
      </div>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gamepad2, Trophy, Settings, QrCode, Save, Download, Plus, Edit, Trash2, Clock, Target, Award, User, Menu } from "lucide-react";
import { useState } from "react";

export function ParticleBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="particle animate-float" style={{ top: '10%', left: '10%', animationDelay: '0s' }}></div>
      <div className="particle animate-float" style={{ top: '20%', left: '80%', animationDelay: '1s' }}></div>
      <div className="particle animate-float" style={{ top: '60%', left: '20%', animationDelay: '2s' }}></div>
      <div className="particle animate-float" style={{ top: '80%', left: '70%', animationDelay: '3s' }}></div>
      <div className="particle animate-float" style={{ top: '40%', left: '90%', animationDelay: '4s' }}></div>
    </div>
  );
}

export function Navigation() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-50 bg-dark-secondary/80 backdrop-blur-lg border-b border-cyan-500/30">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyber-blue to-matrix-green rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-orbitron font-bold bg-gradient-to-r from-cyber-blue to-matrix-green bg-clip-text text-transparent">
              GameQuiz Pro
            </span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/admin">
              <Button 
                variant="ghost" 
                className={`text-gray-300 hover:text-cyber-blue transition-colors ${location === '/admin' || location === '/' ? 'text-cyber-blue' : ''}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button 
                variant="ghost" 
                className={`text-gray-300 hover:text-matrix-green transition-colors ${location.startsWith('/leaderboard') ? 'text-matrix-green' : ''}`}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboards
              </Button>
            </Link>
          </div>
          
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-cyber-blue"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="mt-4 md:hidden space-y-2">
            <Link href="/admin">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-cyber-blue">
                <Settings className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-matrix-green">
                <Trophy className="w-4 h-4 mr-2" />
                Leaderboards
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export function GamingCard({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return (
    <Card className={`gaming-card ${className}`} {...props}>
      {children}
    </Card>
  );
}

export function NeonButton({ children, className = "", variant = "primary", ...props }: { 
  children: React.ReactNode; 
  className?: string; 
  variant?: "primary" | "secondary" | "danger" | "success";
  [key: string]: any 
}) {
  const baseClasses = "font-bold transition-all duration-300 font-orbitron";
  
  const variantClasses = {
    primary: "neon-button",
    secondary: "bg-dark-tertiary border border-cyan-500/30 hover:border-cyber-blue text-white",
    danger: "bg-neon-pink hover:bg-pink-600 text-white",
    success: "bg-matrix-green hover:bg-green-600 text-dark-primary"
  };

  return (
    <Button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      {...props}
    >
      {children}
    </Button>
  );
}

export function QuestionTypeCard({ 
  type, 
  title, 
  description, 
  isSelected, 
  onClick 
}: { 
  type: string;
  title: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:border-cyber-blue/50 ${
        isSelected ? 'border-cyber-blue bg-cyber-blue/10' : 'gaming-card'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          {isSelected && <div className="w-3 h-3 bg-cyber-blue rounded-full"></div>}
        </div>
        <p className="text-sm text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
}

export function QuestionCard({ 
  question, 
  index, 
  onEdit, 
  onDelete 
}: { 
  question: any;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'bg-cyber-blue/20 text-cyber-blue';
      case 'true_false': return 'bg-neon-orange/20 text-neon-orange';
      case 'fill_blank': return 'bg-neon-pink/20 text-neon-pink';
      default: return 'bg-matrix-green/20 text-matrix-green';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Multiple Choice';
      case 'true_false': return 'True/False';
      case 'fill_blank': return 'Fill in Blank';
      case 'reorder': return 'Reorder';
      case 'sorting': return 'Sorting';
      case 'matching': return 'Matching';
      default: return type;
    }
  };

  return (
    <div className="question-card rounded-lg p-4 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <Badge className="bg-cyber-blue text-dark-primary px-3 py-1 rounded-full text-sm font-bold">
              Q{index + 1}
            </Badge>
            <Badge className={`px-3 py-1 rounded-full text-sm ${getTypeColor(question.type)}`}>
              {getTypeLabel(question.type)}
            </Badge>
          </div>
          <h4 className="text-lg font-medium mb-2">{question.questionText}</h4>
          
          {question.type === 'multiple_choice' && question.options && (
            <div className="text-sm text-gray-400 space-y-1">
              {question.options.map((option: string, idx: number) => (
                <div key={idx} className={Array.isArray(question.correctAnswer) && question.correctAnswer.includes(idx) ? 'text-matrix-green' : ''}>
                  {String.fromCharCode(65 + idx)}) {option} {Array.isArray(question.correctAnswer) && question.correctAnswer.includes(idx) && '✓'}
                </div>
              ))}
            </div>
          )}
          
          {question.type === 'true_false' && (
            <div className="text-sm text-gray-400">
              <div className={question.correctAnswer === true ? 'text-matrix-green' : 'text-neon-pink'}>
                {question.correctAnswer === true ? 'True ✓' : 'False ✓'}
              </div>
            </div>
          )}
          
          {question.type === 'fill_blank' && (
            <div className="text-sm text-gray-400">
              <div className="text-matrix-green">Answer: {question.correctAnswer} ✓</div>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="text-cyber-blue hover:text-blue-400 transition-colors"
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-neon-pink hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ icon, label, value, className = "" }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <GamingCard className={`p-6 text-center ${className}`}>
      <div className="flex items-center justify-center mb-2">
        {icon}
      </div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-gray-400">{label}</div>
    </GamingCard>
  );
}

export function LeaderboardPodium({ entries }: { entries: any[] }) {
  if (entries.length < 3) return null;

  const podiumOrder = [entries[1], entries[0], entries[2]]; // 2nd, 1st, 3rd
  const podiumIcons = ['🥈', '👑', '🥉'];
  const podiumColors = ['text-gray-400', 'text-yellow-400', 'text-yellow-600'];
  const podiumBg = [
    'bg-gradient-to-r from-gray-400 to-gray-600',
    'bg-gradient-to-r from-yellow-400 to-yellow-600',
    'bg-gradient-to-r from-yellow-600 to-yellow-800'
  ];

  return (
    <GamingCard className="p-8 mb-8">
      <h2 className="text-2xl font-orbitron font-bold mb-8 text-center text-cyber-blue">Hall of Champions</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {podiumOrder.map((entry, index) => {
          if (!entry) return <div key={index}></div>;
          
          const actualPosition = index === 1 ? 0 : index === 0 ? 1 : 2; // Convert display order to actual position
          return (
            <div key={entry.participantId} className="text-center">
              <div className="relative mb-4">
                <div className={`w-20 h-20 ${podiumBg[actualPosition]} rounded-full mx-auto flex items-center justify-center text-2xl font-bold animate-float`} 
                     style={{ animationDelay: `${actualPosition * 0.2}s` }}>
                  {entry.rank}
                </div>
                <div className="absolute -top-2 -right-2 text-2xl">{podiumIcons[actualPosition]}</div>
              </div>
              <h3 className="text-xl font-bold mb-1">{entry.name}</h3>
              <div className="text-gray-400 text-sm mb-2">{entry.email}</div>
              <div className={`text-2xl font-bold ${podiumColors[actualPosition]}`}>{entry.totalScore}</div>
              {entry.rank === 1 && <div className="text-sm text-matrix-green mt-1">Perfect Score!</div>}
            </div>
          );
        })}
      </div>
    </GamingCard>
  );
}

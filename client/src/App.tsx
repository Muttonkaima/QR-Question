import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AdminPanel from "@/pages/admin";
import QuizRegistration from "@/pages/quiz-registration";
import QuizInterface from "@/pages/quiz-interface";
import QuizResults from "@/pages/quiz-results";
import Leaderboard from "@/pages/leaderboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AdminPanel} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/quiz/:qrCode" component={QuizRegistration} />
      <Route path="/quiz/:qrCode/take/:participantId" component={QuizInterface} />
      <Route path="/quiz/:qrCode/results/:participantId" component={QuizResults} />
      <Route path="/quiz/:qrCode/leaderboard" component={Leaderboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative overflow-hidden min-h-screen bg-dark-primary">
          {/* Particle Background */}
          <div className="fixed inset-0 pointer-events-none">
            <div className="particle" style={{top: '10%', left: '10%', animationDelay: '0s'}}></div>
            <div className="particle" style={{top: '20%', left: '80%', animationDelay: '1s'}}></div>
            <div className="particle" style={{top: '60%', left: '20%', animationDelay: '2s'}}></div>
            <div className="particle" style={{top: '80%', left: '70%', animationDelay: '3s'}}></div>
            <div className="particle" style={{top: '40%', left: '90%', animationDelay: '4s'}}></div>
          </div>
          
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

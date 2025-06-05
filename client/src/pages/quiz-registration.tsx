import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertParticipantSchema } from "@shared/schema";
import { UserPlus, Rocket } from "lucide-react";
import GamingCard from "@/components/ui/gaming-card";

const participantFormSchema = insertParticipantSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
});

export default function QuizRegistration() {
  const { qrCode } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      quizId: 0,
    },
  });

  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuery({
    queryKey: [`/api/quizzes/qr/${qrCode}`],
    enabled: !!qrCode,
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof participantFormSchema>) => {
      const response = await apiRequest("POST", "/api/participants", {
        ...data,
        quizId: quiz.id,
      });
      return response.json();
    },
    onSuccess: (participant) => {
      toast({ title: "Success", description: "Registration successful! Starting quiz..." });
      setLocation(`/quiz/${qrCode}/take/${participant.id}`);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: z.infer<typeof participantFormSchema>) => {
    registerMutation.mutate(data);
  };

  if (quizLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading quiz...</div>
      </div>
    );
  }

  if (quizError || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GamingCard className="p-8 text-center max-w-md mx-4">
          <h2 className="text-2xl font-orbitron font-bold text-red-400 mb-4">Quiz Not Found</h2>
          <p className="text-gray-300">The quiz you're looking for doesn't exist or has been deactivated.</p>
        </GamingCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <GamingCard className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-green-400 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
              <UserPlus className="text-2xl" />
            </div>
            <h2 className="text-3xl font-orbitron font-bold mb-2">JOIN THE GAME</h2>
            <p className="text-gray-400">Enter your details to start the quiz</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your name"
                        className="bg-dark-tertiary border-cyan-500/30 text-white focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="your.email@example.com"
                        className="bg-dark-tertiary border-cyan-500/30 text-white focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Phone Number</FormLabel>
                    <FormControl>
                      <Input 
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        className="bg-dark-tertiary border-cyan-500/30 text-white focus:border-cyan-400 focus:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="neon-button w-full py-4 text-lg font-orbitron"
                disabled={registerMutation.isPending}
              >
                <Rocket className="mr-2 h-5 w-5" />
                START QUIZ
              </Button>
            </form>
          </Form>

          <div className="mt-6 pt-6 border-t border-cyan-500/30 text-center">
            <p className="text-sm text-gray-400">
              Quiz: <span className="text-cyan-400 font-medium">{quiz.title}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Time Limit: <span className="text-green-400 font-medium">{quiz.timeLimit} minutes</span>
            </p>
          </div>
        </GamingCard>
      </div>
    </div>
  );
}

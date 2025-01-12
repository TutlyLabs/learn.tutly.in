"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "~/hooks/use-toast";
import { signIn } from "next-auth/react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { useRouter } from "next/navigation";

const signInSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInInput = z.infer<typeof signInSchema>;

export default function SignIn() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: SignInInput) {
    try {
      setIsLoading(true);
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate Google sign in",
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-2">
      <Card className="w-full max-w-[400px] backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Email or Username</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isLoading} autoComplete="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground/80">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-primary/90 hover:bg-primary transition-colors"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-white/30 dark:border-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-800/30"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGoogleLoading ? "Connecting..." : "Sign in with Google"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

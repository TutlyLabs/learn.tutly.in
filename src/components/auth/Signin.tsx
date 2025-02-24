import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "astro/zod";
import { navigate } from "astro:transitions/client";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const signInSchema = z.object({
  email: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
});

type SignInInput = z.infer<typeof signInSchema>;

export function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    const error = url.searchParams.get("error");

    if (error) {
      toast.error(decodeURIComponent(error).replace(/\+/g, " "), {
        duration: 3000,
        position: "top-center",
      });

      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/signin/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Authentication failed");
      }

      const result = await response.json();

      // Pre-fetch the dashboard page before navigation
      await fetch("/dashboard", {
        credentials: "include",
        headers: {
          app_auth_token:
            document.cookie
              .split("; ")
              .find((row) => row.startsWith("app_auth_token="))
              ?.split("=")[1] || "",
        },
      });

      // Wait for 500ms to ensure the dashboard page is cached
      await new Promise((resolve) => setTimeout(resolve, 500));

      navigate(result.redirectTo || "/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleSignIn = async () => {
  //   try {
  //     setIsGoogleLoading(true);

  //     const currentUrl = new URL(window.location.href);
  //     const error = currentUrl.searchParams.get("error");

  //     if (error) {
  //       throw new Error(decodeURIComponent(error).replace(/\+/g, " "));
  //     }

  //     window.location.href = "/api/auth/signin/google";
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Failed to initiate Google sign in", {
  //       duration: 3000,
  //       position: "top-center",
  //     });
  //   } finally {
  //     setIsGoogleLoading(false);
  //   }
  // };

  return (
    <div className="flex min-h-screen items-center justify-center p-2">
      <Card className="w-full max-w-[400px] backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-white/30 dark:border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
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
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          {...field}
                          disabled={isLoading}
                          autoComplete="current-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-start mt-1">
                <a href="/reset-password" className="text-sm text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <Button
                type="submit"
                className="w-full bg-primary/90 hover:bg-primary transition-colors mt-4"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
          {/* <div className="mt-6 flex flex-col gap-3">
            <Button
              variant="outline"
              className="w-full backdrop-blur-sm bg-white/20 dark:bg-gray-900/20 border-white/30 dark:border-gray-700/50 hover:bg-white/30 dark:hover:bg-gray-800/30"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGoogleLoading ? "Connecting..." : "Sign in with Google"}
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  );
}

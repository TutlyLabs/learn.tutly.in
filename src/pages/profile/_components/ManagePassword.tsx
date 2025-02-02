import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { api } from "@/trpc/react";

const ManagePassword = ({ initialEmail }: { initialEmail?: string }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [canResend, setCanResend] = useState(true);

  const { mutateAsync: sendOTP } = api.resetPassword.sendOTP.useMutation();
  const { mutateAsync: verifyOTP } = api.resetPassword.verifyOTP.useMutation();
  const { mutateAsync: resetPassword } = api.resetPassword.resetPassword.useMutation();

  const checkStrength = (pass: string) => {
    const requirements = [
      { regex: /.{8,}/, text: "At least 8 characters" },
      { regex: /[0-9]/, text: "At least 1 number" },
      { regex: /[a-z]/, text: "At least 1 lowercase letter" },
      { regex: /[A-Z]/, text: "At least 1 uppercase letter" },
    ];

    return requirements.map((req) => ({
      met: req.regex.test(pass),
      text: req.text,
    }));
  };

  const newPasswordStrength = checkStrength(newPassword);

  const getStrengthScore = (strength: { met: boolean; text: string }[]) => {
    return strength.filter((req) => req.met).length;
  };

  const newPasswordScore = useMemo(
    () => getStrengthScore(newPasswordStrength),
    [newPasswordStrength]
  );

  const getStrengthColor = (score: number) => {
    if (score === 0) return "bg-border";
    if (score <= 1) return "bg-red-500";
    if (score <= 2) return "bg-orange-500";
    if (score === 3) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter a password";
    if (score <= 2) return "Weak password";
    if (score === 3) return "Medium password";
    return "Strong password";
  };

  const startResendTimer = (initialTime: number) => {
    setCanResend(false);
    setTimeRemaining(initialTime);

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1000) {
          clearInterval(timer);
          setCanResend(true);
          return null;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await sendOTP({ email });

      if (data.error) {
        toast.error(data.error.message || "Failed to send OTP");
        if (data.error.existingOTP) {
          setStep("otp");
          startResendTimer(data.error.timeRemaining);
        }
        return;
      }

      toast.success("OTP sent to your email");
      setStep("otp");
      startResendTimer(10 * 60 * 1000);
    } catch (error) {
      toast.error("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await verifyOTP({ email, otp });

      if (data.error) {
        toast.error(data.error || "Invalid OTP");
        return;
      }

      toast.success("OTP verified successfully");
      setStep("password");
    } catch (error) {
      toast.error("An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetting(true);
    try {
      const data = await resetPassword({
        email,
        otp,
        password: newPassword,
      });

      if (data.error) {
        toast.error(data.error.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully");
      window.location.href = "/sign-in";
    } catch (error) {
      toast.error("An error occurred while resetting password");
    } finally {
      setIsResetting(false);
    }
  };

  const renderEmailStep = () => (
    <form onSubmit={handleEmailSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Email
        </label>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending OTP...
          </>
        ) : (
          "Send OTP"
        )}
      </Button>
    </form>
  );

  const renderOTPStep = () => (
    <form onSubmit={handleOTPSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Enter OTP
        </label>
        <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)} className="gap-2">
          <InputOTPGroup className="flex justify-center gap-2">
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSeparator />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {timeRemaining && (
        <p className="text-sm text-muted-foreground">
          Resend available in {Math.ceil(timeRemaining / 1000)} seconds
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={!canResend || isLoading}
          onClick={handleEmailSubmit}
        >
          {!canResend ? (
            "Wait to resend"
          ) : isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resending...
            </>
          ) : (
            "Resend OTP"
          )}
        </Button>
      </div>
    </form>
  );

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setShowPasswordStrength(true);
            }}
            className="pe-9"
            aria-invalid={newPasswordScore < 4}
            aria-describedby="password-strength"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {showPasswordStrength && (
          <>
            <div
              className="mb-4 mt-3 h-1 w-full overflow-hidden rounded-full bg-border"
              role="progressbar"
              aria-valuenow={newPasswordScore}
              aria-valuemin={0}
              aria-valuemax={4}
              aria-label="Password strength"
            >
              <div
                className={`h-full ${getStrengthColor(newPasswordScore)} transition-all duration-500 ease-out`}
                style={{ width: `${(newPasswordScore / 4) * 100}%` }}
              />
            </div>

            <p id="password-strength" className="mb-2 text-sm font-medium text-foreground">
              {getStrengthText(newPasswordScore)}. Must contain:
            </p>

            <ul className="space-y-1.5" aria-label="Password requirements">
              {newPasswordStrength.map((req, index) => (
                <li key={index} className="flex items-center gap-2">
                  {req.met ? (
                    <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/80" aria-hidden="true" />
                  )}
                  <span
                    className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}
                  >
                    {req.text}
                    <span className="sr-only">
                      {req.met ? " - Requirement met" : " - Requirement not met"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pe-9"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {newPassword !== confirmPassword && confirmPassword && (
        <p className="text-sm text-destructive">Passwords do not match</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={
          isResetting || !newPassword || !confirmPassword || newPassword !== confirmPassword
        }
      >
        {isResetting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting Password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="mx-auto w-full max-w-sm rounded-lg bg-background p-8 shadow-sm">
        {step === "email" && renderEmailStep()}
        {step === "otp" && renderOTPStep()}
        {step === "password" && renderPasswordStep()}
      </div>
    </div>
  );
};

export default ManagePassword;

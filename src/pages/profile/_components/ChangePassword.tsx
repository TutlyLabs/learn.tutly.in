import { actions } from "astro:actions";
import { navigate } from "astro:transitions/client";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ChangePassword = ({
  isPasswordExists,
  email,
}: {
  isPasswordExists: boolean;
  email: string;
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPasswordScore < 4) {
      toast.error("Please ensure password meets all requirements");
      return;
    }

    setIsResetting(true);
    const loadingToast = toast.loading(
      isPasswordExists ? "Changing password..." : "Setting password..."
    );

    try {
      const { data, error } = await actions.users_changePassword({
        password: newPassword,
        confirmPassword,
        oldPassword: isPasswordExists ? oldPassword : undefined,
      });

      toast.dismiss(loadingToast);

      if (error) {
        toast.error(error instanceof Error ? error.message : "Failed to reset password");
        return;
      }

      if (data && data.success) {
        toast.success(data.message || "Password changed successfully");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordStrength(false);

        navigate("/sign-in");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : "An error occurred while changing password"
      );
      console.error("Password change error:", error);
    } finally {
      setIsResetting(false);
    }
  };

  const renderPasswordStep = () => (
    <form onSubmit={handlePasswordSubmit} className="space-y-4">
      {isPasswordExists && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="old-password">Current Password</Label>
            <a
              href={`/reset-password?email=${email}`}
              className="text-sm text-primary hover:underline"
            >
              Forgot Password?
            </a>
          </div>
          <div className="relative">
            <Input
              id="old-password"
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="pe-9"
              required
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
              aria-label={showOldPassword ? "Hide password" : "Show password"}
            >
              {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

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
          isResetting ||
          !newPassword ||
          !confirmPassword ||
          newPassword !== confirmPassword ||
          (isPasswordExists && !oldPassword)
        }
      >
        {isResetting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isPasswordExists ? "Changing Password..." : "Setting Password..."}
          </>
        ) : isPasswordExists ? (
          "Change Password"
        ) : (
          "Set Password"
        )}
      </Button>
    </form>
  );

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <div className="mx-auto w-full max-w-sm space-y-6 rounded-lg bg-background p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isPasswordExists ? "Change Password" : "Set Password"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPasswordExists
              ? "Enter your current password and choose a new one"
              : "Choose a strong password for your account"}
          </p>
        </div>
        {renderPasswordStep()}
      </div>
    </div>
  );
};

export default ChangePassword;

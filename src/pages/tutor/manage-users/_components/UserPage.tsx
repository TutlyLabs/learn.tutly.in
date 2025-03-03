import { actions } from "astro:actions";
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { MdLockReset } from "react-icons/md";

import DisplayTable, { type Column } from "@/components/table/DisplayTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserPageProps {
  data: Record<string, any>[];
  totalItems: number;
  userRole?: "INSTRUCTOR" | "MENTOR";
  isAdmin?: boolean;
}

const columns: Column[] = [
  {
    key: "name",
    name: "Name",
    label: "Name",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[A-Za-z0-9\s]{2,50}$/,
      message: "Name must be 2-50 characters, letters and numbers only",
    },
  },
  {
    key: "username",
    name: "Username",
    label: "Username",
    type: "text",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[a-zA-Z0-9_]{3,20}$/,
      message: "Username must be 3-20 characters, alphanumeric and underscore only",
    },
  },
  {
    key: "role",
    name: "Role",
    label: "Role",
    type: "select",
    options: [
      { label: "Student", value: "STUDENT" },
      { label: "Mentor", value: "MENTOR" },
    ],
    sortable: true,
    filterable: true,
  },
  {
    key: "email",
    name: "Email",
    label: "Email",
    type: "email",
    sortable: true,
    filterable: true,
    validation: {
      required: true,
      regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Must be a valid email address",
    },
  },
  {
    key: "mentorUsername",
    name: "Assigned Mentor",
    label: "Assigned Mentor",
    type: "text",
    sortable: true,
    filterable: true,
  },
  {
    key: "password",
    name: "Password",
    label: "Password",
    type: "password",
    sortable: false,
    filterable: false,
    hideInTable: true,
    hidden: true,
    validation: {
      required: false,
      regex: /^.{6,}$/,
      message: "Password must be at least 6 characters",
    },
  },
  {
    key: "oneTimePassword",
    name: "One Time Password",
    label: "One Time Password",
    type: "text",
    sortable: false,
    filterable: false,
    hideInTable: true,
  },
];

const actionWrapper = (action: any) => {
  return async (data: any) => {
    try {
      const result = (await action(data)) as any;
      window.location.reload();
      return { data: result };
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "An error occurred",
        },
      };
    }
  };
};

const UserPage = ({
  data,
  totalItems,
  userRole = "INSTRUCTOR",
  isAdmin = false,
}: UserPageProps) => {
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
  const newPasswordScore = newPasswordStrength.filter((req) => req.met).length;

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

  const handleResetPassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPasswordScore < 4) {
      toast.error("Password does not meet strength requirements");
      return;
    }

    setIsResetting(true);
    try {
      const result = await actions.users_instructor_resetPassword({
        email: selectedUser.email,
        newPassword,
      });

      if (result.data?.success) {
        toast.success("Password reset successfully");
        setOpen(false);
        setNewPassword("");
        setConfirmPassword("");
        setSelectedUser(null);
      } else {
        toast.error(result.data?.message || "Failed to reset password");
      }
    } catch (error) {
      toast.error("An error occurred while resetting password");
    } finally {
      setIsResetting(false);
    }
  };

  const shouldAllowActions = userRole === "INSTRUCTOR" && !isAdmin;

  const viewAction = shouldAllowActions
    ? async (data: any) => {
        try {
          const result = await actions.users_getUser(data);
          return { data: result };
        } catch (error) {
          return {
            data: null,
            error: {
              message: error instanceof Error ? error.message : "Failed to view user",
            },
          };
        }
      }
    : null;

  return (
    <>
      <DisplayTable
        data={data}
        columns={columns}
        defaultView="table"
        filterable={true}
        clientSideProcessing={false}
        totalItems={totalItems}
        defaultPageSize={10}
        onView={viewAction}
        onCreate={shouldAllowActions ? actionWrapper(actions.users_createUser) : null}
        onEdit={shouldAllowActions ? actionWrapper(actions.users_updateUser) : null}
        onDelete={shouldAllowActions ? actionWrapper(actions.users_deleteUser) : null}
        onBulkImport={shouldAllowActions ? actionWrapper(actions.users_bulkUpsert) : null}
        title="Users Management"
        actions={
          shouldAllowActions
            ? [
                {
                  label: "Reset Password",
                  icon: <MdLockReset className="text-red-500 mr-2 h-5 w-5" />,
                  onClick: (user: any) => {
                    setSelectedUser(user);
                    setOpen(true);
                  },
                },
              ]
            : []
        }
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Reset password for user: {selectedUser?.username}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
                  className="pr-9"
                  aria-invalid={newPasswordScore < 4}
                  aria-describedby="password-strength"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
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
                  >
                    <div
                      className={`h-full ${getStrengthColor(newPasswordScore)} transition-all duration-500 ease-out`}
                      style={{ width: `${(newPasswordScore / 4) * 100}%` }}
                    />
                  </div>

                  <p className="mb-2 text-sm font-medium text-foreground">
                    {getStrengthText(newPasswordScore)}. Must contain:
                  </p>

                  <ul className="space-y-1.5">
                    {newPasswordStrength.map((req, index) => (
                      <li key={index} className="flex items-center gap-2">
                        {req.met ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/80" />
                        )}
                        <span
                          className={`text-xs ${req.met ? "text-emerald-600" : "text-muted-foreground"}`}
                        >
                          {req.text}
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
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex h-full w-9 items-center justify-center text-muted-foreground/80 hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {newPassword !== confirmPassword && confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={
                isResetting ||
                !newPassword ||
                !confirmPassword ||
                newPassword !== confirmPassword ||
                newPasswordScore < 4
              }
            >
              {isResetting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserPage;

import { defineAction } from "astro:actions";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import { z } from "zod";

import OTPEmailTemplate from "@/components/email/OTPEmailTemplate";
import db from "@/lib/db";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

export const sendOTPAction = defineAction({
  input: z.object({
    email: z.string().email(),
  }),
  async handler({ email }) {
    try {
      const lowerCaseEmail = email.toLowerCase();
      const user = await db.user.findUnique({
        where: { email: lowerCaseEmail },
      });

      if (!user) {
        return {
          success: false,
          error: {
            message: "No account found with this email address",
          },
        };
      }

      const existingOTP = await db.otp.findFirst({
        where: {
          email: lowerCaseEmail,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existingOTP) {
        const timeSinceLastOTP = Date.now() - existingOTP.createdAt.getTime();
        const timeRemaining = 10 * 60 * 1000 - timeSinceLastOTP;

        if (timeRemaining > 0) {
          return {
            success: false,
            error: {
              message: `Please wait ${Math.ceil(timeRemaining / 60000)} minutes before requesting a new OTP`,
              existingOTP: true,
              timeRemaining,
            },
          };
        }
      }

      await db.otp.deleteMany({
        where: {
          email: lowerCaseEmail,
          used: false,
        },
      });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await db.otp.create({
        data: {
          email: lowerCaseEmail,
          otp,
          type: "PASSWORD_RESET",
          expiresAt,
          createdAt: new Date(),
        },
      });

      const { data, error } = await resend.emails.send({
        from: "Tutly <no-reply@otp.tutly.in>",
        to: [email],
        subject: "Password Reset OTP",
        react: OTPEmailTemplate({
          otp,
          name: user.name || "User",
        }),
      });

      if (error) {
        return {
          success: false,
          error: {
            message: "An error occurred while sending OTP",
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error sending OTP:", error);
      return {
        success: false,
        error: {
          message: "Failed to send OTP",
        },
      };
    }
  },
});

export const verifyOTPAction = defineAction({
  input: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
  async handler({ email, otp }) {
    const lowerCaseEmail = email.toLowerCase();

    try {
      const otpRecord = await db.otp.findFirst({
        where: {
          email: lowerCaseEmail,
          otp,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        return {
          success: false,
          error: "Invalid or expired OTP",
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Error verifying OTP:", error);
      return {
        success: false,
        error: "Failed to verify OTP",
      };
    }
  },
});

export const resetPasswordAction = defineAction({
  input: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
    password: z.string().min(8),
  }),
  async handler({ email, otp, password }) {
    const lowerCaseEmail = email.toLowerCase();

    try {
      const otpRecord = await db.otp.findFirst({
        where: {
          email: lowerCaseEmail,
          otp,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!otpRecord) {
        return {
          success: false,
          error: {
            message: "Invalid or expired OTP",
          },
        };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);

      await db.user.update({
        where: { email: lowerCaseEmail },
        data: { password: hashedPassword },
      });

      await db.otp.update({
        where: { id: otpRecord.id },
        data: { used: true },
      });

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      return {
        success: false,
        error: {
          message: "Failed to reset password",
        },
      };
    }
  },
});

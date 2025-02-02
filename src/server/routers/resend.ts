import { Resend } from "resend";
import { z } from "zod";

import { EmailTemplate } from "@/components/EmailTemplete";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const resend = new Resend(process.env.RESEND_API_KEY);

export const resendRouter = createTRPCRouter({
  sendEmail: protectedProcedure
    .input(
      z.object({
        email: z.string(),
        ip: z.string().nullable(),
        device: z.string().nullable(),
      })
    )
    .mutation(async ({ input }) => {
      const { data, error } = await resend.emails.send({
        from: "Tutly <no-reply@mail.tutly.in>",
        to: ["udaysagar.mail@gmail.com"],
        subject: `New Login from ${input.email}`,
        react: EmailTemplate({ email: input.email, ip: input.ip, device: input.device }),
      });

      if (error) {
        return { data, error };
      }

      return { data };
    }),
});

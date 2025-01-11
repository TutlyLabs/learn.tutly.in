import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const resendRouter = createTRPCRouter({
  sendEmail: protectedProcedure
    .input(z.object({
      to: z.string().email(),
      subject: z.string(),
      html: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const data = await resend.emails.send({
          from: "Tutly <no-reply@tutly.app>",
          to: input.to,
          subject: input.subject,
          html: input.html,
        });

        return { success: true, data };
      } catch (error) {
        return { success: false, error };
      }
    }),

  sendBulkEmail: protectedProcedure
    .input(z.object({
      to: z.array(z.string().email()),
      subject: z.string(),
      html: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        const promises = input.to.map(email =>
          resend.emails.send({
            from: "Tutly <no-reply@tutly.app>",
            to: email,
            subject: input.subject,
            html: input.html,
          })
        );

        const results = await Promise.allSettled(promises);
        return { success: true, results };
      } catch (error) {
        return { success: false, error };
      }
    }),
}); 
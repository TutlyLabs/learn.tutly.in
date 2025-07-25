import { Resend } from "resend";

import LoginTemplete from "@/components/email/LoginTemplete";
import { env } from "@/lib/utils";

const resend = new Resend(env("RESEND_API_KEY"));

export const sendEmail = async ({
  email,
  ip,
  device,
}: {
  email: string;
  ip: string | null;
  device: string | null;
}) => {
  const { data, error } = await resend.emails.send({
    from: "Tutly <no-reply@mail.tutly.in>",
    to: ["udaysagar.mail@gmail.com"],
    subject: `New Login from ${email}`,
    react: LoginTemplete({
      email: email,
      ip,
      device,
      time: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    }),
  });

  if (error) {
    return { data, error };
  }

  return { data };
};

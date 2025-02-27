import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

import EnrollMail from "@/components/email/EnrollMail";

const db = new PrismaClient();
const resend = new Resend(process.env.AUTH_RESEND_API_KEY);

const main = async () => {
  const user = await db.user.findUnique({
    where: {
      username: "",
    },
  });
  if (!user) return;
  let count = 0;
  // for (const user of [user]) {
  count++;
  const { error } = await resend.emails.send({
    from: "Tutly <no-reply@auth.tutly.in>",
    to: [user.email!],
    subject: "Your Credentials to access Tutly",
    react: EnrollMail({
      name: user.name!,
      email: user.email!,
      password: user.oneTimePassword!,
    }),
  });

  const res = `${count} - ${user.email} - ${error?.message || "success"}`;
  console.log(res);
  // }
};

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

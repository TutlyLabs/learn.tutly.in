import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

import EnrollMail from "@/components/email/EnrollMail";

const db = new PrismaClient();
const resend = new Resend(process.env.AUTH_RESEND_API_KEY);

const main = async () => {
  // const users = [
  //   {
  //     "name": "Kavya Sri Venna",
  //     "username": "23071A05D2_MENTOR",
  //     "email": "kavyasrivenna222@gmail.com",
  //     "mobile": "8639586785",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Srivalli Gurram",
  //     "username": "23071A1290_MENTOR",
  //     "email": "srivalli.gurram08@gmail.com",
  //     "mobile": "9398435108",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Vyshnavi Arra",
  //     "username": "23071A0570_MENTOR",
  //     "email": "vyshnavi9arra@gmail.com",
  //     "mobile": "9160939880",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Vaishnavi Tandra",
  //     "username": "23071A05K1_MENTOR",
  //     "email": "tandravaishnavi610@gmail.com",
  //     "mobile": "9398482900",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Gaddam Rishitha",
  //     "username": "23071A0579_MENTOR",
  //     "email": "rishithagaddam79@gmail.com",
  //     "mobile": "9515265828",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Kavya Sahithi",
  //     "username": "23071A05H7_MENTOR",
  //     "email": "kavyasahithi2006@gmail.com",
  //     "mobile": "8330980217",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Y Sai Sathwik Reddy",
  //     "username": "23071A1266_MENTOR",
  //     "email": "121103ysaisathwik@gmail.com",
  //     "mobile": "8977336414",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Apoorva Sai Karthikey Nampalli",
  //     "username": "23071A05H9_MENTOR",
  //     "email": "askarthikey01@gmail.com",
  //     "mobile": "7207283115",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  //   {
  //     "name": "Yalamaddi Devendra",
  //     "username": "23071A05M2_MENTOR",
  //     "email": "devendrayalamaddi@gmail.com",
  //     "mobile": "8019227239",
  //     "organizationId": "ebe68734-9811-4516-a8c1-e55fc8e42df3"
  //   },
  // ];

  // for (const user of users) {
  //   await db.user.update({
  //     where: {
  //       email: user.email.toLowerCase(),
  //     },
  //     data: {
  //       role: "MENTOR",
  //     },
  //   });
  //   // const dbUser = await db.user.create({
  //   //   data: {
  //   //     name: user.name,
  //   //     username: user.username,
  //   //     email: user.email.toLowerCase(),
  //   //     mobile: user.mobile,
  //   //     organizationId: user.organizationId,
  //   //     enrolledUsers: {
  //   //       create: {
  //   //         courseId: "d702f8b0-9329-4642-8422-4be3470fbcd0",
  //   //       }
  //   //     }
  //   //   },
  //   // });

  const dbUser = await db.user.findUnique({
    where: {
      username: "24071A05Q5",
    },
  });
  if (!dbUser) return;
  let count = 0;
  count++;
    const { error } = await resend.emails.send({
      from: "Tutly <no-reply@auth.tutly.in>",
      to: [dbUser.email!],
      subject: "Your Credentials to access Tutly",
      react: EnrollMail({
        name: dbUser.name!,
        email: dbUser.email!,
        password: dbUser.oneTimePassword!,
      }),
    });

    const res = `${count} - ${dbUser.email} - ${error?.message || "success"}`;
    console.log(res);
  }
// };

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });

import EnrollMail from "@/components/email/EnrollMail";
import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const db = new PrismaClient();
const resend = new Resend("re_c5C6xy9k_Mw2GVecv2LNmK2UcfwE6xWGm");

const main = async () => {
  const users = [
    {
      "id": "e10b5f46-bf8e-4f7f-85ea-616e4e99af5b",
      "email": "kaushik.phaniharam@gmail.com",
      "name": "VENKATA RAM KAUSHIK PHANIHARAM",
      "username": "23071A66J2_MENTOR",
      "section": "AIML C",
      "branch": "AIML A",
      "phoneNumber": "9347983496"
    },
    {
      "id": "9de32d91-898e-4574-8c65-fb779d858a3f",
      "email": "srijakotte17@gmail.com",
      "name": "Kotte Srija",
      "username": "23071A6695_MENTOR",
      "section": "AIML B",
      "branch": "AIML B",
      "phoneNumber": "9391876598"
    },
    {
      "id": "9da26ed3-2cbb-41ee-a9ad-b3798055a99f",
      "email": "reddy.lassi@gmail.com",
      "name": "D. Lasya Reddy",
      "username": "23071A66E6_MENTOR",
      "section": "AIML C",
      "branch": "AIML C",
      "phoneNumber": "9059479540"
    },
    {
      "id": "d3f1e7ad-966e-43a4-8449-f4eab85e2e9f",
      "email": "nithinbikkumalla8096@gmail.com",
      "name": "Bikkumalla Nithin Kumar",
      "username": "23071A6707_MENTOR",
      "section": "DS A",
      "branch": "DS A",
      "phoneNumber": "8328450144"
    },
    {
      "id": "aae48785-2e8f-4418-be29-dc67d18344d6",
      "email": "lohithaabhijnaadapa@gmail.com",
      "name": "Lohitha Abhijna Adapa",
      "username": "23071A6702_MENTOR",
      "section": "DS A",
      "branch": "DS B",
      "phoneNumber": "7780378261"
    },
    {
      "id": "88d21883-2264-402e-9813-f478f9bb190b",
      "email": "manvitha.cheekati@gmail.com",
      "name": "Manvitha",
      "username": "23071A6714_MENTOR",
      "section": "DS A",
      "branch": "DS C",
      "phoneNumber": "9392933626"
    },
    {
      "id": "55726014-afd9-4745-ad3f-572801c4551e",
      "email": "amjalabhanu@gmail.com",
      "name": "Amjala Bhanu Sree",
      "username": "23071A6902_MENTOR",
      "section": "IOT A",
      "branch": "IOT",
      "phoneNumber": "9381331830"
    },
    {
      "id": "a64888c4-1011-4efe-b715-6f6e05367108",
      "email": "pranavimukthavaram13@gmail.com",
      "name": "Mukthavaram Pranavi",
      "username": "23071A6739_MENTOR",
      "section": "DS A",
      "branch": "CYB",
      "phoneNumber": "8179051440"
    },
    {
      "id": "0359e149-9c34-477d-9cdc-56b87ee2cfe0",
      "email": "sahithireddykotla@gmail.com",
      "name": "Sahithi Reddy",
      "username": "23071A66J5_MENTOR",
      "section": "AIML C",
      "branch": "AIDS",
      "phoneNumber": "9989026229"
    }
  ];

  for (const user of users) {
    const dbUser = await db.user.findUnique({
      where: {
        id: user.id
      }
    });
    if (!dbUser) {
      console.log(`User ${user.id} not found`);
      continue;
    }
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

    const res = `${dbUser.email} - ${error?.message || "success"}`;
    console.log(res);
  }
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

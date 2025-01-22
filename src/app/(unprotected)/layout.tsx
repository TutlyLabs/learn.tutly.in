import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (session) {
    return redirect("/");
  }

  return (
    <div>
      {children}
    </div>
  );
}

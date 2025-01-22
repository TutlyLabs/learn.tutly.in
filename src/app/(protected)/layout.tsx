import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { AppSidebar } from "~/components/sidebar/AppSidebar";
import { AppHeader } from "~/components/sidebar/AppHeader";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session) {
    return redirect("/signin");
  }

  console.log(session.user);

  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader user={session.user} />
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}

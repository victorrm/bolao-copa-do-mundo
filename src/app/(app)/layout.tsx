import { redirect } from "next/navigation";
import { and, asc, eq, gt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { getBranding } from "@/lib/branding";
import { LogoutButton } from "@/components/logout-button";
import { InstallPwaBanner } from "@/components/install-pwa-banner";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const now = Math.floor(Date.now() / 1000);
  const [next, branding] = await Promise.all([
    db
      .select({ scheduledAt: schema.matches.scheduledAt })
      .from(schema.matches)
      .where(and(gt(schema.matches.scheduledAt, now), eq(schema.matches.status, "scheduled")))
      .orderBy(asc(schema.matches.scheduledAt))
      .limit(1)
      .then((r) => r[0]?.scheduledAt ?? null),
    getBranding(),
  ]);

  const isAdmin = session.user.role === "superadmin";
  const role = isAdmin ? "Administrador" : "Participante";

  return (
    <div className="min-h-screen bg-brand-surface text-brand-text flex">
      <AppSidebar
        nextRoundStart={next}
        isAdmin={isAdmin}
        companyName={branding.companyName}
        logoUrl={branding.logoUrl}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader
          userName={session.user.name ?? session.user.email.split("@")[0]}
          userRole={role}
          userAvatarUrl={session.user.avatarUrl}
          isAdmin={isAdmin}
          companyName={branding.companyName}
          logoUrl={branding.logoUrl}
          logoutSlot={<LogoutButton />}
        />
        <main className="flex-1 px-4 lg:px-6 py-6">{children}</main>
      </div>
      <InstallPwaBanner />
    </div>
  );
}

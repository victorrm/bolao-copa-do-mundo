"use server";

import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit/log";

const Schema = z.object({ email: z.string().email(), password: z.string().min(8) });

/**
 * First-run bootstrap: if SUPERADMIN_EMAIL and SUPERADMIN_BOOTSTRAP_PASSWORD
 * are set in the environment and the credentials submitted at the admin
 * login form match them, create (or promote) the superadmin account on the
 * fly. The account is created with `passwordMustChange = 1` so the operator
 * is forced to set a permanent password right after the first login.
 *
 * This allows the very first admin access to happen without running the
 * `pnpm db:bootstrap` script — useful in serverless deploys where the DB
 * lives in a managed store (D1) the operator can't seed locally.
 */
async function maybeBootstrapSuperadmin(email: string, password: string): Promise<void> {
  const bootstrapEmail = process.env.SUPERADMIN_EMAIL?.toLowerCase().trim();
  const bootstrapPassword = process.env.SUPERADMIN_BOOTSTRAP_PASSWORD;
  if (!bootstrapEmail || !bootstrapPassword) return;
  if (email !== bootstrapEmail) return;
  if (password !== bootstrapPassword) return;

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1)
    .then((r) => r[0]);

  // Already provisioned with a real password — bootstrap is no-op.
  if (existing && existing.passwordHash && existing.role === "superadmin" && !existing.deletedAt) {
    return;
  }

  const hash = await hashPassword(password);
  const now = Math.floor(Date.now() / 1000);

  if (existing) {
    await db
      .update(schema.users)
      .set({
        role: "superadmin",
        passwordHash: hash,
        passwordMustChange: 1,
        deletedAt: null,
      })
      .where(eq(schema.users.id, existing.id));
  } else {
    await db.insert(schema.users).values({
      id: nanoid(21),
      email,
      role: "superadmin",
      passwordHash: hash,
      passwordMustChange: 1,
      consentLgpd: 1,
      consentLgpdAt: now,
      createdAt: now,
    });
  }

  // Make sure the superadmin's email domain is in the allowlist so they can
  // also sign in via magic link once Resend is configured later.
  const domain = email.split("@")[1];
  if (domain) {
    const existingDomain = await db
      .select()
      .from(schema.allowedDomains)
      .where(eq(schema.allowedDomains.domain, domain))
      .limit(1)
      .then((r) => r[0]);
    if (!existingDomain) {
      await db.insert(schema.allowedDomains).values({
        domain,
        isWildcard: 0,
        createdAt: now,
      });
    }
  }

  await logAudit(null, "admin.bootstrap.superadmin", email, { source: "env" });
}

export async function adminLogin(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dados inválidos" };

  const email = parsed.data.email.trim().toLowerCase();

  await maybeBootstrapSuperadmin(email, parsed.data.password);

  const user = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1).then((r) => r[0]);

  const generic = { ok: false, error: "Credenciais inválidas" } as const;
  if (!user || user.role !== "superadmin" || !user.passwordHash || user.deletedAt) return generic;

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) {
    await logAudit(user.id, "admin.login.failed", user.email);
    return generic;
  }

  const now = Math.floor(Date.now() / 1000);
  await db.update(schema.users).set({ lastLoginAt: now }).where(eq(schema.users.id, user.id));
  await createSession(user.id);
  await logAudit(user.id, "admin.login.success", user.email);

  if (user.passwordMustChange) redirect("/admin/change-password");
  redirect("/admin");
}

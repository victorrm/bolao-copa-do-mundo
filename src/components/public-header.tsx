import Link from "next/link";
import { Trophy } from "lucide-react";
import { getCurrentSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/#features", label: "Recursos" },
  { href: "/#especiais", label: "Especiais" },
  { href: "/#ranking", label: "Ranking" },
  { href: "/#grupos", label: "Grupos" },
  { href: "/sobre", label: "Sobre" },
  { href: "/#faq", label: "FAQ" },
];

export async function PublicHeader() {
  const session = await getCurrentSession();
  return (
    <header className="border-b border-brand-border/60 bg-brand-surface/85 backdrop-blur-md sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16 gap-3">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary/60 shadow-[0_4px_16px_-4px_hsl(var(--brand-primary)/0.6)]">
            <Trophy className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold text-lg leading-none">
            Bolão <span className="text-brand-primary">2026</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-7 text-sm text-brand-text-muted">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand-text transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session ? (
            <Link href="/home">
              <Button>Voltar ao bolão</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/login">
                <Button>Criar meu bolão</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

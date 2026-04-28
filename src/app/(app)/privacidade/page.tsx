import { Card, CardContent } from "@/components/ui/card";

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="font-display text-3xl font-bold">Política de privacidade</h1>
      <Card>
        <CardContent className="prose prose-sm max-w-none py-6 space-y-3">
          <p>Esta política descreve como tratamos seus dados pessoais conforme a LGPD.</p>
          <h2 className="font-display text-lg font-semibold">Dados coletados</h2>
          <ul className="list-disc pl-5">
            <li>Email corporativo (necessário para login)</li>
            <li>Nome de exibição (informado no onboarding)</li>
            <li>Telefone (opcional)</li>
            <li>Logs de acesso (IP em hash, user agent)</li>
          </ul>
          <h2 className="font-display text-lg font-semibold">Seus direitos</h2>
          <ul className="list-disc pl-5">
            <li>Exportar seus dados a qualquer momento (no perfil)</li>
            <li>Excluir sua conta (soft delete imediato, exclusão definitiva em 30 dias)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

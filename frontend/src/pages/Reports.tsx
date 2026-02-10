import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Construction } from 'lucide-react';

export default function Reports() {
  return (
    <div className="space-y-[16px]">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">Relatórios</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Relatórios e exportações do sistema
        </p>
      </div>

      <Card className="border-[var(--color-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Em construção
          </CardTitle>
          <CardDescription>
            Esta página está em desenvolvimento. Em breve você terá acesso a relatórios e exportações.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
          <Construction className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">Recursos em breve</p>
          <p className="text-sm mt-1">Aguarde as próximas atualizações.</p>
        </CardContent>
      </Card>
    </div>
  );
}

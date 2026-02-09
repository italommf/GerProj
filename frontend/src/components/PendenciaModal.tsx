import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface PendenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  cardName: string;
}

export function PendenciaModal({
  isOpen,
  onClose,
  onConfirm,
  cardName,
}: PendenciaModalProps) {
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!motivo.trim()) {
      setError('O motivo da pendência é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(motivo.trim());
      setMotivo('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao salvar pendência. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMotivo('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent onClose={handleClose} className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Motivo da Pendência</DialogTitle>
          <DialogDescription>
            Descreva o motivo pelo qual o card "{cardName}" está sendo movido para "Parado por Pendências".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-[16px] mt-[16px]">
          <div className="space-y-[8px]">
            <Label htmlFor="motivo-pendencia">Motivo *</Label>
            <Textarea
              id="motivo-pendencia"
              placeholder="Descreva o motivo da pendência..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={5}
              required
              disabled={loading}
              className="resize-none"
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Este motivo será registrado no log do card.
            </p>
          </div>

          {error && (
            <div className="p-[8px] text-sm text-[var(--color-destructive)] bg-red-50 border border-red-200 rounded-[8px]">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !motivo.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-[8px] h-[16px] w-[16px] animate-spin" />
                  Salvando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

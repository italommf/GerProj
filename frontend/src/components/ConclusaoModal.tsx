import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConclusaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cardName?: string;
}

export function ConclusaoModal({ isOpen, onClose, onConfirm, cardName }: ConclusaoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Confirmar Conclusão do Card</DialogTitle>
          <DialogDescription className="whitespace-pre-line">
            {cardName && `Card: ${cardName}\n\n`}
            Ao concluir o card, não será mais possível arrastá-lo para outra etapa.
            {'\n\n'}
            Tem certeza que deseja concluir este card?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-[8px]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
          >
            Não
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Sim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

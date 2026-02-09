import * as React from "react";
import { Calendar, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface DateTimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string; // YYYY-MM-DDTHH:mm format
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suggestedDate?: string; // YYYY-MM-DDTHH:mm format - Data sugerida baseada em dias úteis
}

// Converte YYYY-MM-DDTHH:mm para DD/MM/YYYY HH:mm
const formatToDisplay = (isoDateTime: string): string => {
  if (!isoDateTime) return '';
  const [datePart, timePart] = isoDateTime.split('T');
  if (!datePart) return '';
  
  const [year, month, day] = datePart.split('-');
  const dateStr = `${day}/${month}/${year}`;
  
  if (timePart) {
    const [hours, minutes] = timePart.split(':');
    return `${dateStr} ${hours}:${minutes}`;
  }
  return dateStr;
};

// Converte Date para YYYY-MM-DDTHH:mm
const formatToISO = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Converte YYYY-MM-DDTHH:mm para Date
const parseISO = (isoDateTime: string): Date | null => {
  if (!isoDateTime) return null;
  const [datePart, timePart] = isoDateTime.split('T');
  if (!datePart) return null;
  
  const [year, month, day] = datePart.split('-').map(Number);
  let hours = 0;
  let minutes = 0;
  
  if (timePart) {
    const [h, m] = timePart.split(':').map(Number);
    hours = h || 0;
    minutes = m || 0;
  }
  
  return new Date(year, month - 1, day, hours, minutes);
};

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  ({ className, value = '', onChange, disabled, suggestedDate, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(() => {
      const parsed = parseISO(value);
      if (parsed) return parsed;
      // Não selecionar nenhuma data por padrão
      return null;
    });
    const [selectedTime, setSelectedTime] = React.useState<{ hours: number; minutes: number }>(() => {
      const parsed = parseISO(value);
      if (parsed) {
        return { hours: parsed.getHours(), minutes: parsed.getMinutes() };
      }
      // Se não tem valor, usar hora padrão 18:00
      return { hours: 18, minutes: 0 };
    });
    const [currentMonth, setCurrentMonth] = React.useState(new Date());
    
    // Parse da data sugerida
    const suggestedDateObj = suggestedDate ? parseISO(suggestedDate) : null;

    // Atualiza quando value muda externamente
    React.useEffect(() => {
      const parsed = parseISO(value);
      if (parsed) {
        setSelectedDate(parsed);
        setSelectedTime({ hours: parsed.getHours(), minutes: parsed.getMinutes() });
      } else {
        // Se não tem valor, usar data de hoje e hora 18:00
        const today = new Date();
        setSelectedDate(today);
        setSelectedTime({ hours: 18, minutes: 0 });
      }
    }, [value]);
    
    // Quando abrir o modal, se não tiver valor, não selecionar data mas usar hora 18:00
    React.useEffect(() => {
      if (isOpen && !value) {
        setSelectedDate(null);
        setSelectedTime({ hours: 18, minutes: 0 });
      }
    }, [isOpen, value]);

    const handleConfirm = () => {
      if (!selectedDate) {
        // Se não há data selecionada, usar a data de hoje
        const today = new Date();
        today.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
        const isoValue = formatToISO(today);
        
        const syntheticEvent = {
          target: {
            value: isoValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange?.(syntheticEvent);
        setIsOpen(false);
        return;
      }
      
      const date = new Date(selectedDate);
      date.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);
      const isoValue = formatToISO(date);
      
      const syntheticEvent = {
        target: {
          value: isoValue,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
      setIsOpen(false);
    };

    const handleClear = () => {
      const syntheticEvent = {
        target: {
          value: '',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
      setIsOpen(false);
    };

    // Calendário
    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days: (number | null)[] = [];
      
      // Dias do mês anterior para preencher a primeira semana
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      // Dias do mês atual
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }
      
      return days;
    };

    const isToday = (day: number | null, month: Date) => {
      if (day === null) return false;
      const today = new Date();
      return (
        day === today.getDate() &&
        month.getMonth() === today.getMonth() &&
        month.getFullYear() === today.getFullYear()
      );
    };

    const isSelected = (day: number | null, month: Date) => {
      if (day === null || !selectedDate) return false;
      return (
        day === selectedDate.getDate() &&
        month.getMonth() === selectedDate.getMonth() &&
        month.getFullYear() === selectedDate.getFullYear()
      );
    };

    const isSuggested = (day: number | null, month: Date) => {
      if (day === null || !suggestedDateObj) return false;
      return (
        day === suggestedDateObj.getDate() &&
        month.getMonth() === suggestedDateObj.getMonth() &&
        month.getFullYear() === suggestedDateObj.getFullYear()
      );
    };

    const isInRange = (day: number | null, month: Date) => {
      if (day === null) return false;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Data do dia sendo verificado
      const checkDate = new Date(month.getFullYear(), month.getMonth(), day);
      checkDate.setHours(0, 0, 0, 0);
      
      // Se a data verificada é hoje ou antes, não está no intervalo
      if (checkDate <= today) return false;
      
      // Data final do intervalo (sugerida ou selecionada)
      let endDate: Date | null = null;
      
      // Se há uma data selecionada e ela é futura, usar ela
      if (selectedDate) {
        const selectedDateOnly = new Date(selectedDate);
        selectedDateOnly.setHours(0, 0, 0, 0);
        if (selectedDateOnly >= today) {
          endDate = selectedDateOnly;
        }
      }
      
      // Se não há data selecionada ou a selecionada não é futura, usar a sugerida
      if (!endDate && suggestedDateObj) {
        const suggestedDateOnly = new Date(suggestedDateObj);
        suggestedDateOnly.setHours(0, 0, 0, 0);
        if (suggestedDateOnly > today) {
          endDate = suggestedDateOnly;
        }
      }
      
      // Se não há data final, não está no intervalo
      if (!endDate) return false;
      
      // Verificar se está no intervalo (hoje até a data final, excluindo hoje e a data final)
      return checkDate > today && checkDate < endDate;
    };

    const handleDayClick = (day: number) => {
      const newDate = new Date(currentMonth);
      newDate.setDate(day);
      setSelectedDate(newDate);
    };

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newMonth = new Date(currentMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      setCurrentMonth(newMonth);
    };

    const goToToday = () => {
      const today = new Date();
      setCurrentMonth(today);
      setSelectedDate(today);
      setSelectedTime({ hours: today.getHours(), minutes: today.getMinutes() });
    };

    const displayValue = formatToDisplay(value);

    return (
      <>
        <div className="relative">
          <input
            type="text"
            readOnly
            placeholder="Clique para selecionar data e hora"
            className={cn(
              "flex h-[40px] w-full rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-[16px] pr-[80px] py-[8px] text-sm ring-offset-background",
              "placeholder:text-[var(--color-muted-foreground)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "cursor-pointer",
              !displayValue && "text-[var(--color-muted-foreground)]",
              displayValue && "text-[var(--color-foreground)]",
              className
            )}
            value={displayValue || ''}
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            {...props}
          />
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors disabled:opacity-50"
            title="Escolher data e hora"
          >
            <Calendar className="h-[20px] w-[20px]" />
          </button>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-[500px] p-0" onClose={() => setIsOpen(false)}>
            <DialogHeader className="p-6 pb-4">
              <DialogTitle>Selecionar Data e Hora</DialogTitle>
            </DialogHeader>

            <div className="p-6 pt-0 space-y-6">
              {/* Calendário */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                    className="h-8 w-8 p-0"
                  >
                    ←
                  </Button>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--color-foreground)]">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="h-7 px-2 text-xs"
                    >
                      Hoje
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                    className="h-8 w-8 p-0"
                  >
                    →
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-medium text-[var(--color-muted-foreground)] py-2"
                    >
                      {day}
                    </div>
                  ))}
                  {getDaysInMonth(currentMonth).map((day, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => day !== null && handleDayClick(day)}
                      disabled={day === null}
                      className={cn(
                        "h-9 w-9 rounded-[8px] text-sm transition-colors",
                        day === null && "cursor-default",
                        day !== null && "hover:bg-[var(--color-accent)]",
                        // Data de hoje (verde claro - início)
                        isToday(day, currentMonth) && "bg-green-100 text-green-700 font-semibold",
                        // Data selecionada (azul escuro)
                        isSelected(day, currentMonth) && "bg-blue-600 text-white font-semibold hover:bg-blue-700",
                        // Data sugerida (contorno azul com azul claro no meio)
                        isSuggested(day, currentMonth) && !isSelected(day, currentMonth) && "border-2 border-blue-500 bg-blue-100 text-blue-700 font-semibold",
                        // Datas no intervalo (azul claro)
                        isInRange(day, currentMonth) && !isSelected(day, currentMonth) && !isSuggested(day, currentMonth) && !isToday(day, currentMonth) && "bg-blue-100 text-blue-800",
                        // Outras datas
                        !isSelected(day, currentMonth) && !isToday(day, currentMonth) && !isSuggested(day, currentMonth) && !isInRange(day, currentMonth) && "text-[var(--color-foreground)]"
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                
                {/* Legenda */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-100 border border-green-300"></div>
                    <span className="text-xs text-[var(--color-muted-foreground)]">Inicio</span>
                  </div>
                  <span className="text-xs text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-100"></div>
                    <span className="text-xs text-[var(--color-muted-foreground)]">Intervalo</span>
                  </div>
                  <span className="text-xs text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-100 border-2 border-blue-500"></div>
                    <span className="text-xs text-[var(--color-muted-foreground)]">Entrega Sugerida</span>
                  </div>
                  <span className="text-xs text-gray-400">|</span>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-blue-600"></div>
                    <span className="text-xs text-[var(--color-muted-foreground)]">Entrega Selecionada</span>
                  </div>
                </div>
              </div>

              {/* Seletor de Hora */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
                  <Clock className="h-4 w-4" />
                  Hora
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">
                      Horas
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newHours = selectedTime.hours > 0 ? selectedTime.hours - 1 : 23;
                          setSelectedTime({ ...selectedTime, hours: newHours });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        −
                      </Button>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={selectedTime.hours}
                        onChange={(e) => {
                          const hours = Math.max(0, Math.min(23, parseInt(e.target.value) || 0));
                          setSelectedTime({ ...selectedTime, hours });
                        }}
                        className="flex-1 h-8 rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newHours = selectedTime.hours < 23 ? selectedTime.hours + 1 : 0;
                          setSelectedTime({ ...selectedTime, hours: newHours });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <div className="text-2xl font-semibold text-[var(--color-foreground)] py-6">
                    :
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-[var(--color-muted-foreground)] mb-1 block">
                      Minutos
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMinutes = selectedTime.minutes > 0 ? selectedTime.minutes - 1 : 59;
                          setSelectedTime({ ...selectedTime, minutes: newMinutes });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        −
                      </Button>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={selectedTime.minutes}
                        onChange={(e) => {
                          const minutes = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                          setSelectedTime({ ...selectedTime, minutes });
                        }}
                        className="flex-1 h-8 rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newMinutes = selectedTime.minutes < 59 ? selectedTime.minutes + 1 : 0;
                          setSelectedTime({ ...selectedTime, minutes: newMinutes });
                        }}
                        className="h-8 w-8 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Limpar
                </Button>
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

DateTimePicker.displayName = "DateTimePicker";

export { DateTimePicker };

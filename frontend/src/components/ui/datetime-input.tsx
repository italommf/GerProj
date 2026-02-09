import * as React from "react";
import { Calendar, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateTimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  value?: string; // YYYY-MM-DDTHH:mm format (datetime-local)
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
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

// Converte DD/MM/YYYY HH:mm para YYYY-MM-DDTHH:mm
const formatToISO = (displayDateTime: string): string => {
  if (!displayDateTime) return '';
  
  // Remove caracteres não numéricos exceto espaços e dois pontos
  const cleaned = displayDateTime.replace(/[^\d\s:]/g, '');
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 0) return '';
  
  // Primeira parte: data (DDMMYYYY)
  const dateNumbers = parts[0].replace(/\D/g, '');
  if (dateNumbers.length < 8) return '';
  
  const day = dateNumbers.substring(0, 2);
  const month = dateNumbers.substring(2, 4);
  const year = dateNumbers.substring(4, 8);
  
  // Validação básica
  if (parseInt(day) > 31 || parseInt(month) > 12) return '';
  
  const dateStr = `${year}-${month}-${day}`;
  
  // Segunda parte: hora (HH:mm)
  if (parts.length > 1) {
    const timePart = parts[1];
    const timeMatch = timePart.match(/(\d{1,2}):?(\d{0,2})/);
    if (timeMatch) {
      let hours = timeMatch[1].padStart(2, '0');
      let minutes = (timeMatch[2] || '00').padStart(2, '0');
      
      // Validação
      if (parseInt(hours) > 23) hours = '23';
      if (parseInt(minutes) > 59) minutes = '59';
      
      return `${dateStr}T${hours}:${minutes}`;
    }
  }
  
  return dateStr;
};

// Aplica máscara DD/MM/YYYY HH:mm
const applyMask = (value: string): string => {
  // Remove tudo exceto números, espaços e dois pontos
  const cleaned = value.replace(/[^\d\s:]/g, '');
  const parts = cleaned.split(/\s+/);
  
  if (parts.length === 0) return '';
  
  // Máscara da data
  let datePart = parts[0].replace(/\D/g, '');
  if (datePart.length > 0) {
    if (datePart.length <= 2) {
      datePart = datePart;
    } else if (datePart.length <= 4) {
      datePart = `${datePart.substring(0, 2)}/${datePart.substring(2)}`;
    } else {
      datePart = `${datePart.substring(0, 2)}/${datePart.substring(2, 4)}/${datePart.substring(4, 8)}`;
    }
  }
  
  // Máscara da hora
  if (parts.length > 1) {
    let timePart = parts[1].replace(/[^\d:]/g, '');
    if (timePart.length > 0) {
      if (timePart.length <= 2) {
        timePart = timePart;
      } else {
        timePart = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
      }
    }
    return `${datePart} ${timePart}`.trim();
  }
  
  return datePart;
};

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = React.useState(formatToDisplay(value));
    const [isFocused, setIsFocused] = React.useState(false);

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    // Atualiza displayValue quando value muda externamente
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(formatToDisplay(value));
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Se o valor já está em formato ISO (YYYY-MM-DDTHH:mm), converter diretamente
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(inputValue)) {
        const display = formatToDisplay(inputValue);
        setDisplayValue(display);
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: inputValue,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
        return;
      }
      
      // Caso contrário, aplicar máscara e converter
      const masked = applyMask(inputValue);
      setDisplayValue(masked);
      
      // Converte para ISO e chama onChange
      const isoDateTime = formatToISO(masked);
      if (isoDateTime || masked.length === 0) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: isoDateTime,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange?.(syntheticEvent);
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Garante que o valor está completo ao perder o foco
      if (displayValue && displayValue.length >= 10) {
        const isoDateTime = formatToISO(displayValue);
        if (isoDateTime) {
          setDisplayValue(formatToDisplay(isoDateTime));
        }
      }
    };

    const handleDateIconClick = () => {
      // Cria um input temporário type="datetime-local" para usar o picker nativo
      const tempInput = document.createElement('input');
      tempInput.type = 'datetime-local';
      tempInput.value = value || '';
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.style.pointerEvents = 'none';
      document.body.appendChild(tempInput);
      
      tempInput.showPicker();
      
      tempInput.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        if (target.value) {
          // O picker retorna formato ISO (YYYY-MM-DDTHH:mm), converter para display
          const display = formatToDisplay(target.value);
          setDisplayValue(display);
          
          // Chamar onChange com o valor ISO diretamente
          const syntheticEvent = {
            target: {
              ...inputRef.current!,
              value: target.value,
            },
          } as React.ChangeEvent<HTMLInputElement>;
          onChange?.(syntheticEvent);
        }
        document.body.removeChild(tempInput);
      });
      
      tempInput.addEventListener('cancel', () => {
        document.body.removeChild(tempInput);
      });
    };

    return (
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD/MM/AAAA HH:mm"
          maxLength={16}
          className={cn(
            "flex h-[40px] w-full rounded-[8px] border border-[var(--color-input)] bg-[var(--color-background)] px-[16px] pr-[80px] py-[8px] text-sm ring-offset-background",
            "placeholder:text-[var(--color-muted-foreground)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={inputRef}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        <button
          type="button"
          onClick={handleDateIconClick}
          className="absolute right-[40px] top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          title="Escolher data e hora"
        >
          <Calendar className="h-[20px] w-[20px]" />
        </button>
        <button
          type="button"
          onClick={handleDateIconClick}
          className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
          title="Escolher data e hora"
        >
          <Clock className="h-[20px] w-[20px]" />
        </button>
      </div>
    );
  }
);
DateTimeInput.displayName = "DateTimeInput";

export { DateTimeInput };

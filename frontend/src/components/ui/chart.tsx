"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = id ?? uniqueId;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-[var(--color-muted-foreground)] [&_.recharts-cartesian-grid_line]:stroke-[var(--color-border)] [&_.recharts-curve]:stroke-[var(--color-primary)] [&_.recharts-dot]:stroke-[var(--color-primary)] [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_angle]:stroke-[var(--color-border)] [&_.recharts-radial-bar-background]:fill-[var(--color-muted)] [&_.recharts-rectangle]:stroke-[var(--color-background)] [&_.recharts-sector]:outline-none [&_.recharts-sector]:stroke-[var(--color-background)] [&_.recharts-tooltip-cursor]:fill-[var(--color-muted)] [&_.recharts-tooltip-cursor]:stroke-[var(--color-border)]",
          className
        )}
        style={
          {
            "--color-desktop": "hsl(var(--color-primary))",
            "--color-mobile": "hsl(var(--color-primary) / 0.8)",
            ...Object.entries(config).reduce(
              (acc, [key, value]) => ({
                ...acc,
                ...(value.color && {
                  [`--color-${key}`]: value.color,
                }),
              }),
              {}
            ),
          } as React.CSSProperties
        }
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  dataKey?: string;
  name?: string;
  value?: unknown;
  payload?: Record<string, unknown>;
  color?: string;
};

type ChartTooltipContentProps = React.ComponentProps<"div"> & {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: React.ReactNode;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  labelFormatter?: (value: unknown, payload: unknown[]) => React.ReactNode;
  formatter?: (value: unknown, name: string, item: unknown, index: number, payload: unknown) => React.ReactNode;
  color?: string;
  className?: string;
  labelClassName?: string;
};

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (props, ref) => {
    const {
      active,
      payload,
      className,
      indicator,
      hideLabel,
      hideIndicator,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    } = props;

    const resolvedIndicator: "line" | "dot" | "dashed" = indicator ?? "dot";
    const resolvedHideLabel = hideLabel ?? false;
    const resolvedHideIndicator = hideIndicator ?? false;
    const { config } = useChart();

    if (!active || !payload?.length) {
      return null;
    }

    const labelValue =
      !resolvedHideLabel && (labelKey ? payload[0]?.payload?.[labelKey] : label);
    const formattedLabel =
      labelFormatter && labelValue
        ? labelFormatter(labelValue, payload)
        : labelValue;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {formattedLabel != null && formattedLabel !== "" ? (
          <div
            className={cn(
              "font-medium text-[var(--color-foreground)]",
              labelClassName
            )}
          >
            {formattedLabel as React.ReactNode}
          </div>
        ) : null}
        <div className="grid gap-1.5">
          {(payload ?? []).map((item: TooltipPayloadItem, index: number) => {
            const configKey = (item.dataKey ?? item.name) as string;
            const itemConfig = configKey ? config[configKey] : undefined;
            const displayName =
              nameKey && item.payload?.[nameKey] != null
                ? String(item.payload[nameKey])
                : (itemConfig?.label ?? configKey);
            const indicatorColor = color ?? item.payload?.fill ?? item.color ?? itemConfig?.color;

            return (
              <div
                key={String(item.dataKey ?? index)}
                className="flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-[var(--color-muted-foreground)]"
              >
                {formatter && item?.value !== undefined && item.name !== undefined
                  ? formatter(item.value, item.name, item, index, item.payload)
                  : null}
                {!resolvedHideIndicator ? (
                  <div
                    className="shrink-0 rounded-sm border bg-background"
                    style={{
                      backgroundColor: typeof indicatorColor === "string" ? indicatorColor : undefined,
                      width: resolvedIndicator === "line" ? "1px" : "8px",
                      height: resolvedIndicator === "line" ? "8px" : "8px",
                    }}
                  />
                ) : null}
                <div className="flex flex-1 justify-between leading-none">
                  <span className="text-[var(--color-muted-foreground)]">
                    {displayName as React.ReactNode}
                  </span>
                  {item.value != null && item.value !== "" && (
                    <span className="font-medium text-[var(--color-foreground)] tabular-nums">
                      {String(item.value)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };

import type { Model } from '@/lib/models'

export function ModelChip({
  model,
  className,
  style,
}: {
  model: Model
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-border bg-card/90 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur-sm ${className ?? ''}`}
      style={style}
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${model.badge}`}
      >
        {model.initial}
      </span>
      <span className="text-sm font-medium text-foreground">{model.name}</span>
    </div>
  )
}

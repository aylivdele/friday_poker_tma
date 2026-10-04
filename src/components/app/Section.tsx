import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// Группа на странице: подпись сверху, карточка со строками, пояснение снизу
export function Section({ title, action, footer, children, className, cardClassName }: {
  title?: ReactNode
  action?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
  cardClassName?: string
}) {
  return (
    <section className={cn('px-4 pt-5', className)}>
      {(title || action) && (
        <div className="flex min-h-9 items-end justify-between gap-2 px-1 pb-1.5">
          {title && <h2 className="text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">{title}</h2>}
          {action}
        </div>
      )}
      <div className={cn('divide-y overflow-hidden rounded-2xl bg-card', cardClassName)}>{children}</div>
      {footer && <p className="px-1 pt-2 text-[13px] text-muted-foreground">{footer}</p>}
    </section>
  )
}

// Строка списка внутри Section. С onClick становится кнопкой.
export function Row({ className, onClick, children, ...props }: ComponentProps<'div'> & { onClick?: () => void }) {
  const classes = cn('flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left', onClick && 'transition-colors hover:bg-muted/60 active:bg-muted', className)
  if (onClick) {
    return <button type="button" className={classes} onClick={onClick}>{children}</button>
  }
  return <div className={classes} {...props}>{children}</div>
}

export function RowText({ title, subtitle, className }: { title: ReactNode, subtitle?: ReactNode, className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)}>
      <span className="truncate text-base font-medium">{title}</span>
      {subtitle && <span className="truncate text-[13px] text-muted-foreground">{subtitle}</span>}
    </div>
  )
}

export function EmptyRow({ children }: { children: ReactNode }) {
  return <div className="px-4 py-6 text-center text-sm text-muted-foreground">{children}</div>
}

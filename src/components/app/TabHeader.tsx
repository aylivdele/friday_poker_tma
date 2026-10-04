import type { ReactNode } from 'react'

// Крупный заголовок корневой вкладки («Игры», «Группы», «Профиль») с действием справа
export function TabHeader({ title, action }: { title: string, action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-1">
      <h1 className="text-[30px] leading-tight font-bold tracking-tight">{title}</h1>
      {action}
    </div>
  )
}

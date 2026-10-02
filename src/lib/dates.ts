// Дата игры хранится как полночь UTC календарного дня (так её всегда сохранял <input type="date">)

// Сегодняшняя дата по местному времени в формате YYYY-MM-DD
export function todayInputValue(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// YYYY-MM-DD → timestamp полуночи UTC; пустую или некорректную строку возвращает как null
export function parseDateInput(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) {
    return null
  }
  return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

export function toDateInputValue(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10)
}

import { ObjectId } from 'mongodb'
import { z } from 'zod'

export const zObjectId = z.string()
  .regex(/^[0-9a-f]{24}$/i, 'некорректный идентификатор')
  .transform(id => new ObjectId(id))

const money = z.number().int('должно быть целым').min(0, 'не может быть отрицательным').max(1_000_000)

export const gameSettingsSchema = z.object({
  isFinal: z.boolean(),
  firstEntryCost: money,
  reEntryCost: money,
  maxReEntries: z.number().int('должно быть целым').min(0, 'не может быть отрицательным').max(100),
  prizeFund: z.number().int('должно быть целым').min(0, 'не может быть отрицательным').max(10_000_000).optional(),
})

export const gamePlayerSchema = z.object({
  playerId: zObjectId,
  entries: z.number().int().min(0).max(1000),
})

export const gameResultSchema = z.object({
  playerId: zObjectId,
  score: z.number().int().min(0).max(100_000),
})

export const titleSchema = z.string().trim().min(1, 'не может быть пустым').max(80, 'слишком длинное')

// Дата игры — полночь UTC календарного дня
export const gameDateSchema = z.number().int().min(Date.UTC(2000, 0, 1)).max(Date.UTC(2100, 0, 1))

export const pinSchema = z.string().regex(/^\d{4}$/, 'PIN — 4 цифры')

export const avatarSchema = z.string()
  .max(400_000, 'изображение слишком большое')
  .refine(value => value === '' || /^data:image\/(?:webp|jpeg|png);base64,/.test(value), 'неподдерживаемый формат изображения')

import type { ObjectId, WithId } from 'mongodb'
import type { GameAbilities, GroupAbilities, SeasonAbilities } from '@/types/api'
import type { Game, Group, Player, Season } from '@/types/db'
import { getDb } from '@/core/db'
import { nonNull } from '@/lib/helpers'
import { forbidden, notFound } from './http'

export function isMember(group: Group, playerId: ObjectId) {
  return group.members.some(m => m.equals(playerId))
}

export function isOwner(group: Group, playerId: ObjectId) {
  return group.ownerId.equals(playerId)
}

export function groupAbilities(group: Group, playerId: ObjectId): GroupAbilities {
  const member = isMember(group, playerId)
  const owner = isOwner(group, playerId)
  return {
    join: !member,
    leave: member && !owner,
    delete: owner,
    manage: member,
  }
}

export function seasonAbilities(group: Group, playerId: ObjectId): SeasonAbilities {
  return {
    createGame: isMember(group, playerId),
    delete: isOwner(group, playerId),
  }
}

export function gameAbilities(game: Game, group: Group, playerId: ObjectId): GameAbilities {
  const member = isMember(group, playerId)
  const creatorOrOwner = isOwner(group, playerId) || !!game.creater?.equals(playerId)
  return {
    edit: game.isFinished ? creatorOrOwner : member,
    finish: !game.isFinished && member,
    delete: creatorOrOwner,
  }
}

export async function loadGroup(groupId: ObjectId): Promise<WithId<Group>> {
  const group = await (await getDb()).groups.findOne({ _id: groupId })
  if (!group) {
    throw notFound('Группа не найдена')
  }
  return group
}

export async function loadSeason(seasonId: ObjectId): Promise<WithId<Season>> {
  const season = await (await getDb()).seasons.findOne({ _id: seasonId })
  if (!season) {
    throw notFound('Сезон не найден')
  }
  return season
}

export async function loadGame(gameId: ObjectId): Promise<WithId<Game>> {
  const game = await (await getDb()).games.findOne({ _id: gameId })
  if (!game) {
    throw notFound('Игра не найдена')
  }
  return game
}

export function requireMember(group: Group, playerId: ObjectId) {
  if (!isMember(group, playerId)) {
    throw forbidden('Действие доступно только участникам группы')
  }
}

export function requireOwner(group: Group, playerId: ObjectId) {
  if (!isOwner(group, playerId)) {
    throw forbidden('Действие доступно только владельцу группы')
  }
}

// Имя и фото игрока без Telegram может поправить любой участник его группы.
// Профили пользователей Telegram берут данные из самого Telegram
export async function canEditPlayer(target: WithId<Player>, callerId: ObjectId) {
  if (nonNull(target.telegramId)) {
    return false
  }
  const shared = await (await getDb()).groups.findOne({ members: { $all: [callerId, target._id] } }, { projection: { _id: 1 } })
  return !!shared
}

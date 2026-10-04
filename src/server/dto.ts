import type { ObjectId, WithId } from 'mongodb'
import type { Auth } from './auth'
import type * as Api from '@/types/api'
import type { Game, Group, Player, Season } from '@/types/db'
import { nonNull } from '@/lib/helpers'
import { maskPhone } from '@/lib/phone'
import { gameAbilities, groupAbilities, seasonAbilities } from './permissions'

// Наружу уходят только перечисленные поля: telegramId, телефон и пароль никогда не покидают сервер
export function toPublicPlayer(player: WithId<Player>): Api.Player {
  return {
    _id: player._id.toString(),
    hasTelegram: nonNull(player.telegramId),
    username: player.username,
    firstName: player.firstName,
    lastName: player.lastName,
    avatarUrl: player.avatarUrl,
    createdAt: player.createdAt,
    achievments: player.achievments,
  }
}

export function toMe(auth: Auth): Api.Me {
  return {
    ...toPublicPlayer(auth.player),
    authVia: auth.via,
    hasPassword: !!auth.player.passwordHash,
    phone: auth.player.phone ? maskPhone(auth.player.phone) : null,
    appearance: auth.player.appearance ?? null,
  }
}

export function toPublicGroup(group: WithId<Group>, viewerId: ObjectId): Api.Group {
  return {
    _id: group._id.toString(),
    title: group.title,
    ownerId: group.ownerId.toString(),
    members: group.members.map(m => m.toString()),
    createdAt: group.createdAt,
    can: groupAbilities(group, viewerId),
  }
}

export function toPublicSeason(season: WithId<Season>, group: Group, viewerId: ObjectId): Api.Season {
  return {
    _id: season._id.toString(),
    groupId: season.groupId.toString(),
    title: season.title,
    gameIds: season.gameIds.map(id => id.toString()),
    can: seasonAbilities(group, viewerId),
  }
}

export function toPublicGame(game: WithId<Game>): Api.Game {
  return {
    _id: game._id.toString(),
    groupId: game.groupId.toString(),
    title: game.title,
    isFinished: game.isFinished,
    players: game.players.map(p => ({ playerId: p.playerId.toString(), entries: p.entries })),
    results: game.results?.map(r => ({ playerId: r.playerId.toString(), score: r.score })),
    createdAt: game.createdAt,
    finishedAt: game.finishedAt,
    seasonId: game.seasonId?.toString(),
    settings: game.settings,
    creater: game.creater?.toString(),
    rev: game.rev ?? 0,
    updatedAt: game.updatedAt,
    updatedBy: game.updatedBy?.toString(),
  }
}

export function toGameDetails(game: WithId<Game>, group: Group, viewerId: ObjectId, caps: Record<string, number>): Api.GameDetails {
  return {
    ...toPublicGame(game),
    can: gameAbilities(game, group, viewerId),
    caps,
  }
}

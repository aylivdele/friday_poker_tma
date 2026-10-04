import { describe, expect, it } from 'vitest'
import { parentPath } from './navigation'

describe('parentPath', () => {
  it.each([
    ['/groups/g1/seasons/s1/games/x1', '/groups/g1/seasons/s1'],
    ['/groups/g1/seasons/s1/games/new', '/groups/g1/seasons/s1'],
    ['/groups/g1/seasons/s1', '/groups/g1'],
    ['/groups/g1/seasons/new', '/groups/g1'],
    ['/groups/g1/players/new', '/groups/g1'],
    ['/groups/g1', '/groups'],
    ['/groups/new', '/groups'],
    ['/games/x1', '/games'],
    ['/players/p1', '/'],
    ['/profile', '/'],
  ])('%s → %s', (path, parent) => {
    expect(parentPath(path)).toBe(parent)
  })
})

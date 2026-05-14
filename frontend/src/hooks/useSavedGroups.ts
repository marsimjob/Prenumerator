import { useState, useEffect } from 'react'

export interface SavedGroup {
  groupId: string
  memberId: string
  name: string
  isCreator?: boolean
}

function groupsKey(userId: string)  { return `prenumerator_groups_${userId}` }
function removedKey(userId: string) { return `prenumerator_removed_${userId}` }

function loadRemoved(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(removedKey(userId))
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}

export function useSavedGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<SavedGroup[]>([])

  useEffect(() => {
    if (!userId) { setGroups([]); return }
    try {
      const raw = localStorage.getItem(groupsKey(userId))
      setGroups(raw ? (JSON.parse(raw) as SavedGroup[]) : [])
    } catch {
      setGroups([])
    }
  }, [userId])

  function saveGroup(group: SavedGroup) {
    if (!userId) return
    // Un-hide it if the user explicitly re-adds it
    const removed = loadRemoved(userId)
    removed.delete(group.groupId)
    localStorage.setItem(removedKey(userId), JSON.stringify([...removed]))

    setGroups(prev => {
      const updated = [group, ...prev.filter(g => g.groupId !== group.groupId)]
      localStorage.setItem(groupsKey(userId), JSON.stringify(updated))
      return updated
    })
  }

  function renameGroup(groupId: string, newName: string) {
    if (!userId) return
    setGroups(prev => {
      const updated = prev.map(g => g.groupId === groupId ? { ...g, name: newName } : g)
      localStorage.setItem(groupsKey(userId), JSON.stringify(updated))
      return updated
    })
  }

  function removeGroup(groupId: string) {
    if (!userId) return

    // Persist to blocklist so login re-seed doesn't bring it back
    const removed = loadRemoved(userId)
    removed.add(groupId)
    localStorage.setItem(removedKey(userId), JSON.stringify([...removed]))

    setGroups(prev => {
      const updated = prev.filter(g => g.groupId !== groupId)
      localStorage.setItem(groupsKey(userId), JSON.stringify(updated))
      return updated
    })
  }

  function seedGroups(incoming: SavedGroup[]) {
    if (!userId) return
    const removed = loadRemoved(userId)
    const filtered = incoming.filter(g => !removed.has(g.groupId))

    setGroups(prev => {
      const merged = [
        ...filtered,
        ...prev.filter(p => !filtered.some(i => i.groupId === p.groupId)),
      ]
      localStorage.setItem(groupsKey(userId), JSON.stringify(merged))
      return merged
    })
  }

  return { groups, saveGroup, renameGroup, removeGroup, seedGroups }
}

/** Exported so handleAuth in Landing can filter server groups before merging */
export { loadRemoved }

import { useState, useEffect } from 'react'

export interface SavedGroup {
  groupId: string
  memberId: string
  name: string
}

function storageKey(userId: string) {
  return `prenumerator_groups_${userId}`
}

export function useSavedGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<SavedGroup[]>([])

  // Re-read from localStorage whenever the signed-in user changes
  useEffect(() => {
    if (!userId) { setGroups([]); return }
    try {
      const raw = localStorage.getItem(storageKey(userId))
      setGroups(raw ? (JSON.parse(raw) as SavedGroup[]) : [])
    } catch {
      setGroups([])
    }
  }, [userId])

  function saveGroup(group: SavedGroup) {
    if (!userId) return
    setGroups(prev => {
      const updated = [group, ...prev.filter(g => g.groupId !== group.groupId)]
      localStorage.setItem(storageKey(userId), JSON.stringify(updated))
      return updated
    })
  }

  /** Bulk-seed from server data, merging with any existing local entries. */
  function seedGroups(incoming: SavedGroup[]) {
    if (!userId) return
    setGroups(prev => {
      const merged = [
        ...incoming,
        ...prev.filter(p => !incoming.some(i => i.groupId === p.groupId)),
      ]
      localStorage.setItem(storageKey(userId), JSON.stringify(merged))
      return merged
    })
  }

  return { groups, saveGroup, seedGroups }
}

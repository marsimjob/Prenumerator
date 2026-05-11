import { useState } from 'react'

export interface SavedGroup {
  groupId: string
  memberId: string
  name: string
}

function storageKey(userId: string) {
  return `prenumerator_groups_${userId}`
}

export function useSavedGroups(userId: string | undefined) {
  const [groups, setGroups] = useState<SavedGroup[]>(() => {
    if (!userId) return []
    try {
      const raw = localStorage.getItem(storageKey(userId))
      return raw ? (JSON.parse(raw) as SavedGroup[]) : []
    } catch {
      return []
    }
  })

  function saveGroup(group: SavedGroup) {
    if (!userId) return
    setGroups(prev => {
      const updated = [
        group,
        ...prev.filter(g => g.groupId !== group.groupId),
      ]
      localStorage.setItem(storageKey(userId), JSON.stringify(updated))
      return updated
    })
  }

  return { groups, saveGroup }
}

import { useState } from 'react'

const ACCOUNT_KEY = 'prenumerator_account'

export interface Account {
  userId: string
  username: string
  displayName: string
  avatarColor: string
  phoneNumber: string | null
}

export function useAccount() {
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const raw = localStorage.getItem(ACCOUNT_KEY)
      return raw ? (JSON.parse(raw) as Account) : null
    } catch {
      return null
    }
  })

  function saveAccount(a: Account) {
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a))
    setAccount(a)
  }

  function updatePhone(phoneNumber: string | null) {
    if (!account) return
    const updated = { ...account, phoneNumber }
    localStorage.setItem(ACCOUNT_KEY, JSON.stringify(updated))
    setAccount(updated)
  }

  function clearAccount() {
    localStorage.removeItem(ACCOUNT_KEY)
    setAccount(null)
  }

  return { account, saveAccount, updatePhone, clearAccount }
}

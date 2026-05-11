import { useState } from 'react'

const ACCOUNT_KEY = 'prenumerator_account'

export interface Account {
  userId: string
  username: string
  displayName: string
  avatarColor: string
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

  function clearAccount() {
    localStorage.removeItem(ACCOUNT_KEY)
    setAccount(null)
  }

  return { account, saveAccount, clearAccount }
}

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Identity } from '../types'

interface UserContextValue {
  identity: Identity | null
  setIdentity: (identity: Identity) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null)

  return (
    <UserContext.Provider value={{ identity, setIdentity }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUserContext(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUserContext must be used within UserProvider')
  return ctx
}

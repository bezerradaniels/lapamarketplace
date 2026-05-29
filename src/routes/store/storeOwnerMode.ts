import { createContext, useContext } from 'react'

export type OwnerModeContextValue = {
  isOwner: boolean
  ownerMode: 'visitor' | 'lojista'
}

export const OwnerModeContext = createContext<OwnerModeContextValue>({
  isOwner: false,
  ownerMode: 'visitor',
})

export function useStoreOwnerMode() {
  return useContext(OwnerModeContext)
}

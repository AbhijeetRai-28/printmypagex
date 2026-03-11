"use client"

import { auth } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"

type AuthFetchOptions = {
  forceRefresh?: boolean
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: AuthFetchOptions = {}
) {
  let user = auth.currentUser
  if (!user) {
    user = await new Promise<User | null>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
        unsubscribe()
        resolve(nextUser)
      })
    })
  }

  if (!user) {
    throw new Error("Authentication required")
  }

  const token = await user.getIdToken(Boolean(options.forceRefresh))
  const headers = new Headers(init.headers || {})
  headers.set("Authorization", `Bearer ${token}`)

  return fetch(input, {
    ...init,
    headers
  })
}

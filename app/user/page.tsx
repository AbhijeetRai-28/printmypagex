"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { authFetch } from "@/lib/client-auth"
import { isOwnerEmail } from "@/lib/owner-access"

export default function UserEntryRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/user/login")
        return
      }

      if (isOwnerEmail(user.email)) {
        router.replace("/admin")
        return
      }

      try {
        const res = await authFetch(`/api/user/details?firebaseUID=${user.uid}`)
        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data?.user) {
          router.replace("/complete-profile")
          return
        }

        const role = String(data.user.role || "USER")

        if (role === "SUPPLIER") {
          router.replace("/supplier/dashboard")
          return
        }

        if (role === "ADMIN") {
          router.replace("/admin")
          return
        }

        router.replace("/user/dashboard")
      } catch {
        router.replace("/user/login")
      }
    })

    return () => unsubscribe()
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400">Redirecting...</p>
    </div>
  )
}


"use client"

import { useEffect, useState } from "react"
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"
import { auth, provider } from "@/lib/firebase"
import CandleThemeToggle from "@/components/CandleThemeToggle"
import HeroBackground from "@/components/HeroBackground"
import CursorDepth from "@/components/CursorDepth"

function getAllowedEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export default function AdminLoginPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return

      const allowedEmails = getAllowedEmails()
      const email = String(user.email || "").toLowerCase()
      if (email && (allowedEmails.length === 0 || allowedEmails.includes(email))) {
        router.replace("/admin")
        return
      }

      await signOut(auth).catch(() => {})
    })

    return () => unsubscribe()
  }, [router])

  const login = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await signInWithPopup(auth, provider)
      const user = result.user
      const email = (user.email || "").toLowerCase()

      const allowedEmails = getAllowedEmails()
      if (!email || (allowedEmails.length > 0 && !allowedEmails.includes(email))) {
        await signOut(auth)
        setError("This Google account is not allowed for admin login.")
        setLoading(false)
        return
      }

      const idToken = await user.getIdToken()
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        }
      })

      const data = (await res.json()) as { success?: boolean; message?: string }

      if (!res.ok || !data.success) {
        await signOut(auth)
        setError(data.message || "Admin login failed")
        setLoading(false)
        return
      }

      window.location.href = "/admin"
    } catch (caughtError) {
      console.error(caughtError)
      setError("Failed to login as admin")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white overflow-hidden">
      <CursorDepth />

      <div className="h-28 md:h-32" />

      <div className="w-full flex justify-center fixed top-6 z-50">
        <nav className="flex items-center justify-between px-8 md:px-12 py-4 w-[95%] max-w-[1400px] rounded-3xl backdrop-blur-3xl bg-white/70 dark:bg-black/40 border border-gray-200 dark:border-white/20 shadow-[0_8px_40px_rgba(0,0,0,0.2)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)]">
          <h1
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
            onClick={() => router.push("/")}
          >
            PrintMyPage
          </h1>

          <div className="flex items-center gap-6">
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-white/20 bg-white/80 dark:bg-white/5 backdrop-blur-md text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/10 transition"
            >
              Back to Site
            </button>
            <CandleThemeToggle />
          </div>
        </nav>
      </div>

      <section className="relative px-6 md:px-10 py-12 md:py-20 min-h-[calc(100vh-9rem)] flex items-center">
        <HeroBackground />

        <div className="relative w-full max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8 xl:gap-14 items-center">
          <div className="space-y-7" data-depth="24">
            <p className="text-xs uppercase tracking-[0.28em] text-indigo-500 dark:text-cyan-300">
              Technician Access Zone
            </p>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Admin Command
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Authentication Portal
              </span>
            </h1>

            <p className="max-w-2xl text-gray-600 dark:text-gray-300 text-base md:text-lg">
              Owner-only secure console for platform operations, supplier governance, payout control, and service monitoring.
            </p>

            <div className="flex flex-wrap gap-3 text-sm">
              {["Owner-gated", "Google verified", "Role enforced"].map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full border border-gray-200 dark:border-white/20 bg-white/70 dark:bg-white/5 backdrop-blur-md"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div
            className="relative backdrop-blur-3xl bg-white/70 dark:bg-black/40 border border-gray-200 dark:border-white/20 rounded-3xl p-8 md:p-10 shadow-[0_16px_60px_rgba(0,0,0,0.16)] dark:shadow-[0_16px_60px_rgba(0,0,0,0.45)]"
            data-depth="44"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Secure Area</p>
            <h2 className="text-2xl font-semibold mt-2">Sign in as Admin</h2>
            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
              Continue with your owner Google account to access the control center.
            </p>

            <button
              onClick={login}
              disabled={loading}
              className="mt-7 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-semibold hover:scale-[1.02] transition disabled:opacity-60"
            >
              {loading ? "Checking access..." : "Continue with Google"}
            </button>

            {error ? (
              <p className="mt-4 text-sm text-red-500 border border-red-500/40 rounded-xl px-3 py-2 bg-red-500/5">
                {error}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}

"use client"

import { useState } from "react"
import { signInWithPopup, signOut } from "firebase/auth"
import { auth, provider } from "@/lib/firebase"

function getAllowedEmails() {
  return (process.env.NEXT_PUBLIC_ADMIN_OWNER_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export default function AdminLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

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

      const data = await res.json()

      if (!res.ok || !data.success) {
        await signOut(auth)
        setError(data.message || "Admin login failed")
        setLoading(false)
        return
      }

      window.location.href = "/admin"
    } catch (e) {
      console.error(e)
      setError("Failed to login as admin")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-400">Secure Area</p>
          <h1 className="text-3xl font-bold mt-2">Admin Portal Login</h1>
          <p className="text-slate-400 text-sm mt-2">
            Only the owner Google account can sign in.
          </p>
        </div>

        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-cyan-400 text-slate-900 font-semibold disabled:opacity-50"
        >
          {loading ? "Checking access..." : "Continue with Google"}
        </button>

        {error ? (
          <p className="text-red-400 text-sm border border-red-500/40 rounded-xl px-3 py-2">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  )
}

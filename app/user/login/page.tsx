"use client"

import { auth, provider } from "@/lib/firebase"
import { signInWithPopup, signOut } from "firebase/auth"
import Navbar from "@/components/Navbar"

export default function UserLogin() {

  const login = async () => {

    const result = await signInWithPopup(auth, provider)

    const user = result.user

    await fetch("/api/user/check-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firebaseUID: user.uid,
        email: user.email || user.providerData?.[0]?.email || ""
      })
    })

    const res = await fetch(`/api/user/details?firebaseUID=${user.uid}`)
    const data = await res.json()

    if (data.user) {
      if (data.user.active === false || data.user.approved === false) {
        await signOut(auth)
        alert("Your account is not allowed to login right now.")
        return
      }
      window.location.href = "/user/dashboard"
    } else {
      window.location.href = "/complete-profile"
    }

  }

  return (
    <div>

      <Navbar />

      <div className="flex justify-center items-center min-h-[80vh]">

        <div className="bg-card p-10 rounded-2xl w-96 text-center shadow-lg">

          <h1 className="text-3xl font-bold mb-6">
            User Login
          </h1>

          <button
            onClick={login}
            className="w-full py-3 bg-primary text-black rounded-xl font-semibold hover:opacity-90"
          >
            Continue with Google
          </button>

        </div>

      </div>

    </div>
  )
}

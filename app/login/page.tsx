"use client"

import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

export default function LoginPage() {

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      const user = result.user

      console.log("Logged in user:", user)

      alert("Login successful!")

    } catch (error) {
      console.error("Login error:", error)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="p-10 border rounded-xl shadow-lg text-center">
        <h1 className="text-3xl font-bold mb-6">Login</h1>

        <button
          onClick={handleGoogleLogin}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Continue with Google
        </button>

      </div>
    </div>
  )
}
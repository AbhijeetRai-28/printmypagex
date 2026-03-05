"use client"

import Navbar from "@/components/Navbar"
import { auth, provider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"

export default function UserRegister() {

  const register = async () => {

    const result = await signInWithPopup(auth, provider)

    const user = result.user

    const res = await fetch(`/api/user/details?firebaseUID=${user.uid}`)
    const data = await res.json()

    if (data.user) {
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
            Create Account
          </h1>

          <button
            onClick={register}
            className="w-full py-3 bg-primary text-black rounded-xl font-semibold hover:opacity-90"
          >
            Continue with Google
          </button>

        </div>

      </div>

    </div>
  )
}
"use client"

import { useState, useEffect, useRef } from "react"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"
import { useRouter } from "next/navigation"

interface Props {
  orderCount?: number
  onProfileClick?: () => void
}

export default function DashboardNavbar({
  orderCount = 0,
  onProfileClick
}: Props) {

  const [open, setOpen] = useState(false)
  const router = useRouter()
  const dropdownRef = useRef<HTMLDivElement>(null)

  const user = auth.currentUser
  const userInitial =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U"

  const logout = async () => {
    await signOut(auth)
    router.push("/")
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <nav className="flex justify-between items-center px-10 py-6 border-b border-white/10 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">

      {/* Logo */}
      <h1
        className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
        onClick={() => router.push("/user/dashboard")}
      >
        PrintMyPage
      </h1>

      <div className="flex items-center gap-10">

        {/* Orders */}
        <button
          onClick={() => router.push("/user/orders")}
          className="relative text-gray-300 hover:text-white transition"
        >
          My Orders

          {orderCount > 0 && (
            <span className="absolute -top-2 -right-4 bg-gradient-to-r from-indigo-500 to-cyan-500 text-xs px-2 py-0.5 rounded-full shadow-md">
              {orderCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>

          <div
            onClick={() => setOpen(!open)}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center cursor-pointer text-black font-bold shadow-lg hover:scale-105 transition"
          >
            {userInitial}
          </div>

          {open && (
            <div className="absolute right-0 mt-4 w-64 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 space-y-3">

              <div className="text-sm text-gray-400 border-b border-white/10 pb-2 break-all">
                {user?.email}
              </div>

              <button
                onClick={() => {
                  setOpen(false)
                  onProfileClick?.()
                }}
                className="block w-full text-left hover:text-indigo-400 transition"
              >
                View Profile
              </button>

              <button
                onClick={logout}
                className="block w-full text-left text-red-400 hover:text-red-300 transition"
              >
                Logout
              </button>

            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
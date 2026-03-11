"use client"

import { useState, useEffect, useRef } from "react"
import { auth } from "@/lib/firebase"
import { signOut, onAuthStateChanged, type User } from "firebase/auth"
import { useRouter, usePathname } from "next/navigation"
import toast from "react-hot-toast"
import { authFetch } from "@/lib/client-auth"

type SupplierProfile = {
  firebaseUID: string
  name?: string
  email?: string
  phone?: string
  rollNo?: string
  branch?: string
  year?: string
  active?: boolean
  photoURL?: string
  firebasePhotoURL?: string
  displayPhotoURL?: string
}

export default function SupplierNavbar() {
  const router = useRouter()
  const pathname = usePathname()

  const [user, setUser] = useState<User | null>(null)
  const [supplier, setSupplier] = useState<SupplierProfile | null>(null)
  const [open, setOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [togglingActive, setTogglingActive] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState("")
  const [profileForm, setProfileForm] = useState({
    name: "",
    rollNo: "",
    phone: ""
  })

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })

    return () => unsub()
  }, [])

  const refreshSupplier = async (uid: string) => {
    const res = await authFetch(`/api/supplier/me?firebaseUID=${uid}`)
    const data = await res.json()
    setSupplier(data.supplier || null)
  }

  useEffect(() => {
    if (!user) return
    refreshSupplier(user.uid)
  }, [user])

  const logout = async () => {
    await signOut(auth)
    router.push("/supplier")
  }

  const toggleActive = async () => {
    if (!user || !supplier || togglingActive) return

    setTogglingActive(true)

    try {
      const res = await authFetch("/api/supplier/toggle-active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firebaseUID: user.uid,
          active: !supplier.active
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update status")
        return
      }

      setSupplier(data.supplier)
      toast.success(data.supplier.active ? "Supplier Activated" : "Supplier Deactivated")
    } catch {
      toast.error("Failed to update active status")
    } finally {
      setTogglingActive(false)
    }
  }

  const openProfile = () => {
    if (!supplier) return

    setProfileForm({
      name: supplier.name || "",
      rollNo: supplier.rollNo || "",
      phone: supplier.phone || ""
    })
    setPhotoPreview(supplier.displayPhotoURL || supplier.photoURL || supplier.firebasePhotoURL || "")
    setPhotoFile(null)
    setIsEditingProfile(false)
    setShowProfile(true)
  }

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file)
    if (!file) {
      setPhotoPreview(supplier?.displayPhotoURL || supplier?.photoURL || supplier?.firebasePhotoURL || "")
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPhotoPreview(localUrl)
  }

  const saveProfile = async () => {
    if (!user || !supplier) return

    const name = profileForm.name.trim()
    const rollNo = profileForm.rollNo.trim()
    const phone = profileForm.phone.trim()

    if (!name) {
      toast.error("Name is required")
      return
    }

    if (!/^\d+$/.test(rollNo)) {
      toast.error("Roll number must be numeric")
      return
    }

    if (!/^\d{10,15}$/.test(phone)) {
      toast.error("Phone must be 10 to 15 digits")
      return
    }

    setSavingProfile(true)

    try {
      let nextPhotoURL = supplier.displayPhotoURL || supplier.photoURL || supplier.firebasePhotoURL || ""

      if (photoFile) {
        const photoFormData = new FormData()
        photoFormData.append("file", photoFile)
        photoFormData.append("firebaseUID", user.uid)

        const photoRes = await authFetch("/api/supplier/upload-photo", {
          method: "POST",
          body: photoFormData
        })

        const photoData = await photoRes.json()

        if (!photoRes.ok || !photoData.success) {
          toast.error(photoData.message || "Failed to upload profile photo")
          setSavingProfile(false)
          return
        }

        nextPhotoURL = photoData.photoURL || nextPhotoURL
      }

      const res = await authFetch("/api/supplier/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          firebaseUID: user.uid,
          name,
          rollNo,
          phone
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to update profile")
        setSavingProfile(false)
        return
      }

      setSupplier({
        ...data.supplier,
        photoURL: nextPhotoURL,
        displayPhotoURL: nextPhotoURL
      })
      setPhotoFile(null)
      setIsEditingProfile(false)
      toast.success("Profile updated")
    } catch {
      toast.error("Failed to update profile")
    } finally {
      setSavingProfile(false)
    }
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

    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const resolvedNavbarPhoto =
    supplier?.displayPhotoURL ||
    supplier?.photoURL ||
    supplier?.firebasePhotoURL ||
    ""

  const userInitial =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "U"

  const profileInitial = (supplier?.name || user?.email || "S").charAt(0).toUpperCase()

  return (
    <>
      <nav className="w-full border-b border-white/10 bg-black/50 backdrop-blur-2xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-12 py-6">
          <h1
            onClick={() => router.push("/supplier")}
            className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
          >
            PrintMyPage
          </h1>

          <div className="flex items-center gap-12">
            {!user && (
              <>
                <button
                  onClick={() => router.push("/supplier/login")}
                  className="text-gray-300 hover:text-white transition"
                >
                  Login
                </button>

                <button
                  onClick={() => router.push("/supplier/register")}
                  className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition"
                >
                  Register
                </button>
              </>
            )}

            {user && (
              <>
                {pathname === "/supplier" && (
                  <button
                    onClick={() => router.push("/supplier/dashboard")}
                    className="text-gray-300 hover:text-white transition"
                  >
                    Dashboard
                  </button>
                )}

                {pathname === "/supplier/dashboard" && (
                  <button
                    onClick={() => router.push("/supplier/orders")}
                    className="text-gray-300 hover:text-white transition"
                  >
                    My Orders
                  </button>
                )}

                {pathname === "/supplier/orders" && (
                  <button
                    onClick={() => router.push("/supplier/dashboard")}
                    className="text-gray-300 hover:text-white transition"
                  >
                    Dashboard
                  </button>
                )}

                <div className="relative" ref={dropdownRef}>
                  <div
                    onClick={() => setOpen(!open)}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center font-bold text-black cursor-pointer shadow-lg hover:scale-105 transition overflow-hidden"
                  >
                    {resolvedNavbarPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolvedNavbarPhoto}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitial
                    )}
                  </div>

                  {open && (
                    <div className="absolute right-0 mt-5 w-72 bg-[#0b1220] border border-white/10 rounded-xl shadow-2xl p-4 space-y-4">
                      <div className="text-sm text-gray-400 border-b border-white/10 pb-3 break-all">
                        {user?.email}
                      </div>

                      <button
                        onClick={() => {
                          setOpen(false)
                          openProfile()
                        }}
                        className="block w-full text-left hover:text-indigo-400 transition"
                      >
                        View Profile
                      </button>

                      <div className={`flex items-center justify-between py-2 ${togglingActive ? "opacity-60 pointer-events-none" : ""}`}>
                        <p className="text-sm text-gray-300 font-medium">
                          {supplier?.active ? "Active" : "Inactive"}
                        </p>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={supplier?.active || false}
                            onChange={toggleActive}
                            className="sr-only peer"
                          />

                          <div className="peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-500 w-12 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-['✖️'] after:rounded-full after:absolute after:outline-none after:h-10 after:w-10 after:bg-gray-50 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-hover:after:scale-75 peer-checked:after:content-['✔️'] after:-rotate-180 peer-checked:after:rotate-0" />
                        </label>
                      </div>

                      <hr className="border-white/10" />

                      <button
                        onClick={logout}
                        className="block w-full text-left text-red-400 hover:text-red-300 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {showProfile && supplier && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-b from-[#0f172a] to-[#020617] border border-white/10 rounded-2xl p-8 w-full max-w-[520px] shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6">Supplier Profile</h2>

            <div className="flex justify-center mb-6">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt={supplier.name || "Supplier"}
                  className="w-24 h-24 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-indigo-500/30 border border-indigo-300/30 flex items-center justify-center text-3xl font-bold text-indigo-100">
                  {profileInitial}
                </div>
              )}
            </div>

            {isEditingProfile && (
              <div className="mb-5">
                <label className="text-sm text-gray-400 mb-1 block">Upload Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                  className="input w-full"
                />
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-400">Name</p>
                <input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  readOnly={!isEditingProfile}
                  className={`input w-full ${!isEditingProfile ? "opacity-80" : ""}`}
                />
              </div>

              <div>
                <p className="text-gray-400">Email</p>
                <input
                  value={supplier.email || ""}
                  readOnly
                  className="input w-full opacity-70"
                />
              </div>

              <div>
                <p className="text-gray-400">Phone</p>
                <input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, "") }))}
                  readOnly={!isEditingProfile}
                  className={`input w-full ${!isEditingProfile ? "opacity-80" : ""}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400">Branch</p>
                  <input
                    value={supplier.branch || ""}
                    readOnly
                    className="input w-full opacity-70"
                  />
                </div>

                <div>
                  <p className="text-gray-400">Year</p>
                  <input
                    value={supplier.year || ""}
                    readOnly
                    className="input w-full opacity-70"
                  />
                </div>
              </div>

              <div>
                <p className="text-gray-400">Roll No</p>
                <input
                  value={profileForm.rollNo}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, rollNo: e.target.value.replace(/\D/g, "") }))}
                  readOnly={!isEditingProfile}
                  className={`input w-full ${!isEditingProfile ? "opacity-80" : ""}`}
                />
              </div>

              <div>
                <p className="text-gray-400">Status</p>
                <p className="font-medium">{supplier.active ? "Active" : "Inactive"}</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {!isEditingProfile ? (
                <button
                  onClick={() => setIsEditingProfile(true)}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 transition py-2 rounded-lg"
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={saveProfile}
                    disabled={savingProfile}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 transition py-2 rounded-lg disabled:opacity-60"
                  >
                    {savingProfile ? "Saving..." : "Save Changes"}
                  </button>

                  <button
                    onClick={() => {
                      setIsEditingProfile(false)
                      setProfileForm({
                        name: supplier.name || "",
                        rollNo: supplier.rollNo || "",
                        phone: supplier.phone || ""
                      })
                      setPhotoFile(null)
                      setPhotoPreview(
                        supplier.displayPhotoURL || supplier.photoURL || supplier.firebasePhotoURL || ""
                      )
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 transition py-2 rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              )}

              <button
                onClick={() => setShowProfile(false)}
                className="w-full bg-white/10 hover:bg-white/20 transition py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

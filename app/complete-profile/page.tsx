"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { auth } from "@/lib/firebase"
import toast from "react-hot-toast"

type ProfileForm = {
  name: string
  rollNo: string
  branch: string
  section: string
  year: string
  phone: string
}

export default function CompleteProfile() {
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    rollNo: "",
    branch: "",
    section: "",
    year: "",
    phone: ""
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (["rollNo", "phone", "year"].includes(name)) {
      setForm((prev) => ({
        ...prev,
        [name]: value.replace(/\D/g, "")
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const user = auth.currentUser

    if (!user) {
      alert("User not logged in")
      return
    }

    const res = await fetch("/api/user/create-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firebaseUID: user.uid,
        email: user.email || user.providerData?.[0]?.email || "",
        ...form
      })
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      toast.error(data.message || "Invalid profile data")
      return
    }

    toast.success("Congratulations! You achieved the status of a PrintMyPage user 🚀")
    window.location.href = "/user/dashboard"
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="bg-card p-10 rounded-3xl shadow-2xl w-full max-w-3xl">
        <h2 className="text-3xl font-bold mb-2 text-center text-gradient">
          Complete Your Profile
        </h2>

        <p className="text-gray-400 text-center mb-8">
          One step away from printing magic ✨
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                pattern="[A-Za-z ]+"
                title="Name should contain only text"
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Roll Number</label>
              <input
                name="rollNo"
                value={form.rollNo}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="\d+"
                title="Roll number should contain only numbers"
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Branch</label>
              <input
                name="branch"
                value={form.branch}
                onChange={handleChange}
                required
                pattern="[A-Za-z ]+"
                title="Branch should contain only text"
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Section</label>
              <input
                name="section"
                value={form.section}
                onChange={handleChange}
                required
                pattern="[A-Za-z ]+"
                title="Section should contain only text"
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Year</label>
              <input
                name="year"
                type="number"
                min={1}
                max={8}
                value={form.year}
                onChange={handleChange}
                required
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1 block">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="\d{10,15}"
                title="Phone should be 10 to 15 digits"
                className="input w-full focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full py-3 rounded-xl bg-primary font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
          >
            Create Profile
          </button>
        </form>
      </div>
    </div>
  )
}

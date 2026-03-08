"use client"

import { ChangeEvent, useState } from "react"
import { auth } from "@/lib/firebase"

type SupplierForm = {
  name: string
  phone: string
  rollNo: string
  branch: string
  year: string
}

export default function SupplierApply() {
  const [form, setForm] = useState<SupplierForm>({
    name: "",
    phone: "",
    rollNo: "",
    branch: "",
    year: ""
  })

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (["phone", "rollNo", "year"].includes(name)) {
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

  const submit = async () => {
    const user = auth.currentUser

    if (!user) {
      alert("Please login first")
      return
    }

    const res = await fetch("/api/supplier/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        firebaseUID: user.uid,
        email: user.email || user.providerData?.[0]?.email || "",
        photoURL: user.photoURL || "",
        ...form
      })
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      alert(data.error || "Invalid supplier form data")
      return
    }

    alert("Application sent to admin for approval")
    window.location.href = "/supplier/login"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-card p-10 rounded-2xl w-[500px] space-y-5">
        <h1 className="text-3xl font-bold text-center">Supplier Application</h1>

        <input
          name="name"
          value={form.name}
          placeholder="Full Name"
          className="input w-full"
          onChange={handleChange}
          pattern="[A-Za-z ]+"
          title="Name should contain only text"
          required
        />

        <input
          name="phone"
          value={form.phone}
          placeholder="Phone Number"
          className="input w-full"
          onChange={handleChange}
          inputMode="numeric"
          pattern="\d{10,15}"
          title="Phone should be 10 to 15 digits"
          required
        />

        <input
          name="rollNo"
          value={form.rollNo}
          placeholder="Roll Number"
          className="input w-full"
          onChange={handleChange}
          inputMode="numeric"
          pattern="\d+"
          title="Roll number should contain only numbers"
          required
        />

        <input
          name="branch"
          value={form.branch}
          placeholder="Branch"
          className="input w-full"
          onChange={handleChange}
          pattern="[A-Za-z ]+"
          title="Branch should contain only text"
          required
        />

        <input
          name="year"
          value={form.year}
          placeholder="Year"
          className="input w-full"
          onChange={handleChange}
          inputMode="numeric"
          pattern="\d+"
          title="Year should contain only numbers"
          required
        />

        <button
          onClick={submit}
          className="w-full py-3 bg-primary rounded-xl hover:scale-105"
        >
          Submit Application
        </button>
      </div>
    </div>
  )
}

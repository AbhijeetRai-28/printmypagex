"use client"

import Link from "next/link"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"

export default function SupplierNavbar(){

const logout = async()=>{
 await signOut(auth)
 window.location.href="/"
}

return(

<nav className="w-full border-b border-white/10 bg-black/40 backdrop-blur-xl">

<div className="max-w-6xl mx-auto flex justify-between items-center p-4">

<h1 className="text-xl font-bold text-gradient">
PrintMyPage
</h1>

<div className="flex gap-6 items-center">

<Link
href="/supplier"
className="text-white/80 hover:text-white"
>
Home
</Link>

<Link
href="/supplier/dashboard"
className="text-white/80 hover:text-white"
>
Dashboard
</Link>

<button
onClick={logout}
className="px-4 py-2 rounded-xl bg-red-500/80 hover:bg-red-500"
>
Logout
</button>

</div>

</div>

</nav>

)

}
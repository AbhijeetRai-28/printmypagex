"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import ThemeToggle from "./ThemeToggle"

export default function Navbar(){

const [user,setUser] = useState<any>(null)

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(u)=>{
setUser(u)
})

return ()=>unsubscribe()

},[])

const logout = async()=>{
await signOut(auth)
}

return(

<nav className="flex justify-between items-center px-8 py-5 border-b border-gray-800 dark:border-gray-200">

<Link href="/" className="text-2xl font-bold text-green-400">
PrintMyPage
</Link>

<div className="flex items-center gap-6">

<Link href="/pricing">Pricing</Link>
<Link href="/contact">Contact</Link>

{!user && (
<>
<Link href="/supplier/login">Supplier</Link>
<Link href="/user/login">Login</Link>
<Link href="/user/register">Register</Link>
</>
)}

{user && (
<>
<Link
href="/user/dashboard"
className="px-4 py-2 rounded-lg bg-indigo-500 text-white"
>
Dashboard
</Link>

<button
onClick={logout}
className="text-red-400"
>
Logout
</button>
</>
)}

<ThemeToggle/>

</div>

</nav>

)

}
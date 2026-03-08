"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AdminSuppliers(){
const router = useRouter()

useEffect(()=>{
router.replace("/admin")
},[router])

return(
<div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
<p>Redirecting to admin portal...</p>
</div>

)

}

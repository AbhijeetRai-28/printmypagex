"use client"

import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { useRouter } from "next/navigation"

export default function SupplierGuard({
children
}:{
children:React.ReactNode
}){

const [loading,setLoading] = useState(true)
const router = useRouter()

useEffect(()=>{

const unsub = onAuthStateChanged(auth,(user)=>{

if(!user){
router.push("/supplier/login")
return
}

setLoading(false)

})

return ()=>unsub()

},[])

if(loading){
return(
<div className="flex items-center justify-center min-h-screen">
<p className="text-gray-400">Loading dashboard...</p>
</div>
)
}

return <>{children}</>

}
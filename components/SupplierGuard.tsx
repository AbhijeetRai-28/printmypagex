"use client"

import { useEffect,useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { useRouter } from "next/navigation"
import { isOwnerEmail } from "@/lib/owner-access"
import { authFetch } from "@/lib/client-auth"

export default function SupplierGuard({
children
}:{
children:React.ReactNode
}){

const [loading,setLoading] = useState(true)
const router = useRouter()

useEffect(()=>{

const unsub = onAuthStateChanged(auth,async(user)=>{

if(!user){
setLoading(false)
router.replace("/supplier/login")
return
}

if(isOwnerEmail(user.email)){
setLoading(false)
return
}

try{
const res = await authFetch(
`/api/supplier/me?firebaseUID=${user.uid}`
)

const data = await res.json()

if(!data.supplier){
setLoading(false)
router.replace("/supplier/register")
return
}

if(!data.supplier.approved){
setLoading(false)
router.replace("/supplier")
return
}

if(!data.supplier.active){
setLoading(false)
router.replace("/supplier")
return
}

setLoading(false)
}catch{
await signOut(auth).catch(()=>{})
setLoading(false)
router.replace("/supplier/login")
}

})

return ()=>unsub()

},[router])

if(loading){
return(

<div className="flex items-center justify-center min-h-screen">

<p className="text-gray-400">
Loading dashboard...
</p>

</div>

)
}

return <>{children}</>

}

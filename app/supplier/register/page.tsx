"use client"

import { auth, provider } from "@/lib/firebase"
import { signInWithPopup } from "firebase/auth"

export default function SupplierRegister(){

const register = async()=>{

try{

const result = await signInWithPopup(auth,provider)

const user = result.user

const res = await fetch(
`/api/supplier/me?firebaseUID=${user.uid}`
)

const data = await res.json()

if(data.supplier){
window.location.href="/supplier/login"
}else{
window.location.href="/supplier/apply"
}

}catch(err){
alert("Registration failed")
}

}

return(

<div className="min-h-screen flex items-center justify-center">

<div className="bg-card p-10 rounded-2xl w-[400px] text-center space-y-6">

<h1 className="text-3xl font-bold">
Supplier Registration
</h1>

<p className="text-white/70">
Sign in with Google to register as supplier.
</p>

<button
onClick={register}
className="w-full py-3 bg-primary rounded-xl hover:scale-105"
>
Register with Google
</button>

</div>

</div>

)

}
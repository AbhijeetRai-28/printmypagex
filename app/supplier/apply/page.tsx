"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"

export default function SupplierApply(){

const [form,setForm] = useState({
name:"",
phone:"",
rollNo:"",
branch:"",
year:""
})

const handleChange=(e:any)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const submit = async()=>{

const user = auth.currentUser

const res = await fetch("/api/supplier/apply",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
firebaseUID:user?.uid,
email:user?.email || user?.providerData?.[0]?.email || "",
...form
})
})

const data = await res.json()

if(data.error){
alert(data.error)
return
}

alert("Application sent to admin")
window.location.href="/"

}

return(

<div className="min-h-screen flex items-center justify-center p-6">

<div className="bg-card p-10 rounded-2xl w-[500px] space-y-5">

<h1 className="text-3xl font-bold text-center">
Supplier Application
</h1>

<input
name="name"
placeholder="Full Name"
className="input w-full"
onChange={handleChange}
/>

<input
name="phone"
placeholder="Phone Number"
className="input w-full"
onChange={handleChange}
/>

<input
name="rollNo"
placeholder="Roll Number"
className="input w-full"
onChange={handleChange}
/>

<input
name="branch"
placeholder="Branch"
className="input w-full"
onChange={handleChange}
/>

<input
name="year"
placeholder="Year"
className="input w-full"
onChange={handleChange}
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

"use client"

import { useState } from "react"
import { auth } from "@/lib/firebase"
import toast from "react-hot-toast"

export default function CompleteProfile() {

const [form,setForm] = useState({
name:"",
rollNo:"",
branch:"",
section:"",
year:"",
phone:""
})

const handleChange = (e:any)=>{
setForm({...form,[e.target.name]:e.target.value})
}

const handleSubmit = async (e:any)=>{

e.preventDefault()

const user = auth.currentUser

if(!user){
alert("User not logged in")
return
}

const res = await fetch("/api/user/create-profile",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
firebaseUID:user.uid,
...form
})
})

const data = await res.json()

if(data.success){

toast.success("Congratulations! You achieved the status of a PrintMyPage user 🚀")
window.location.href="/user/dashboard"
}

}

return(

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
<label className="text-sm text-gray-400 mb-1 block">
Name
</label>
<input
name="name"
onChange={handleChange}
required
className="input w-full focus:ring-2 focus:ring-indigo-500"
/>
</div>

<div>
<label className="text-sm text-gray-400 mb-1 block">
Roll Number
</label>
<input
name="rollNo"
onChange={handleChange}
required
className="input w-full focus:ring-2 focus:ring-indigo-500"
/>
</div>

<div>
<label className="text-sm text-gray-400 mb-1 block">
Branch
</label>
<input
name="branch"
onChange={handleChange}
required
className="input w-full focus:ring-2 focus:ring-indigo-500"
/>
</div>

<div>
<label className="text-sm text-gray-400 mb-1 block">
Section
</label>
<input
name="section"
onChange={handleChange}
required
className="input w-full focus:ring-2 focus:ring-indigo-500"
/>
</div>

<div>
<label className="text-sm text-gray-400 mb-1 block">
Year
</label>
<input
name="year"
type="number"
onChange={handleChange}
required
className="input w-full focus:ring-2 focus:ring-indigo-500"
/>
</div>

<div>
<label className="text-sm text-gray-400 mb-1 block">
Phone
</label>
<input
name="phone"
onChange={handleChange}
required
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
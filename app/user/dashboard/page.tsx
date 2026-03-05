"use client"

import RoleGuard from "@/components/RoleGuard"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import DashboardNavbar from "@/components/DashboardNavbar"
import toast from "react-hot-toast"

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts"

export default function UserDashboard() {

  const [orders, setOrders] = useState<any[]>([])
  const [userData, setUserData] = useState<any>(null)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [duration, setDuration] = useState("week")

  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [alternatePhone, setAlternatePhone] = useState("")
  const [printType, setPrintType] = useState("bw")

  const [requestType, setRequestType] = useState("global")
  const [supplier, setSupplier] = useState("")

  const [duplex, setDuplex] = useState(false)
  const [instruction, setInstruction] = useState("")

  useEffect(() => {

    const unsubscribe = auth.onAuthStateChanged(async (user) => {

      if (!user) return

      try {

        const [userRes, orderRes, supRes] = await Promise.all([
          fetch(`/api/user/details?firebaseUID=${user.uid}`),
          fetch(`/api/orders/user?firebaseUID=${user.uid}`),
          fetch("/api/supplier/list")
        ])

        const userJson = await userRes.json()
        const orderJson = await orderRes.json()
        const supJson = await supRes.json()

        if (!userJson.user) {

          window.location.href="/complete-profile"
          return

        }

        setUserData(userJson.user)
        setOrders(orderJson.orders || [])
        setSuppliers(supJson.suppliers || [])

      } catch (err) {
        console.error(err)
      }

      setLoading(false)

    })

    return () => unsubscribe()

  }, [])

  function generateChartData(orders:any[], duration:string){

    const grouped:any = {}

    orders.forEach(order=>{

      const date = new Date(order.createdAt)

      let key=""

      if(duration==="day") key=`${date.getHours()}:00`
      if(duration==="week") key=date.toLocaleDateString("en-US",{weekday:"short"})
      if(duration==="month") key=date.getDate().toString()
      if(duration==="year") key=date.toLocaleDateString("en-US",{month:"short"})
      if(duration==="all") key=`${date.getFullYear()}-${date.getMonth()+1}`

      grouped[key]=(grouped[key]||0)+1

    })

    return Object.keys(grouped).map(k=>({
      label:k,
      orders:grouped[k]
    }))

  }

  const chartData = generateChartData(orders,duration)

  const handleSubmit = async (e:any)=>{

    e.preventDefault()

    if(!file){
      toast.error("Nice try. But invisible files are not supported yet 😌")
      return
    }

    const user = auth.currentUser
    if(!user) return

    if(requestType==="specific" && !supplier){
      toast.error("Select a supplier first.")
      return
    }

    setSubmitting(true)

    const formData=new FormData()

    formData.append("file",file)
    formData.append("printType",printType)
    formData.append("firebaseUID",user.uid)

    formData.append("requestType",requestType)
    formData.append("supplier",supplier)

    formData.append("alternatePhone",alternatePhone)
    formData.append("duplex",String(duplex))
    formData.append("instruction",instruction)

    const res=await fetch("/api/upload",{
      method:"POST",
      body:formData
    })

    const data=await res.json()

    setSubmitting(false)

    if(data.error){
      toast.error(data.error)
      return
    }

    toast.success(`Pages: ${data.pages} | Estimated Price: ₹${data.estimatedPrice}`)

    setOrders(prev=>[data.order,...prev])

    setFile(null)
    setInstruction("")
    setAlternatePhone("")
    setDuplex(false)

  }

  const totalOrders=orders.length
  const pending=orders.filter(o=>o.status==="pending").length
  const completed=orders.filter(o=>o.status==="completed").length

  const totalSpent=orders.reduce(
    (acc,o)=>acc+(o.finalPrice||o.estimatedPrice||0),0
  )

  if(loading) return null

  return (

<RoleGuard role="USER">

<div className="min-h-screen bg-gradient-to-br from-black via-[#0f0f1a] to-[#12122a] text-white">

<DashboardNavbar
orderCount={totalOrders}
onProfileClick={()=>setShowProfile(true)}
/>

<div className="px-6 md:px-16 py-14 space-y-16">

{/* STATS */}

<div className="grid md:grid-cols-4 gap-8">

{[
{label:"Total Orders",value:totalOrders},
{label:"Pending",value:pending},
{label:"Completed",value:completed},
{label:"Total Spent",value:`₹${totalSpent}`}
].map((stat,i)=>(

<div
key={i}
className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl"
>

<p className="text-gray-400 text-sm mb-2">{stat.label}</p>
<h2 className="text-4xl font-bold">{stat.value}</h2>

</div>

))}

</div>

{/* CREATE ORDER */}

<div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-xl">

<h2 className="text-2xl font-semibold mb-6">
Create New Order
</h2>

{!showForm && (

<button
onClick={()=>setShowForm(true)}
className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:scale-105 transition"
>

Start Printing

</button>

)}

{showForm && (

<form onSubmit={handleSubmit} className="space-y-6 mt-6">

<div className="grid md:grid-cols-3 gap-6">
<input value={userData?.name || ""} readOnly className="input"/>
<input value={userData?.rollNo || ""} readOnly className="input"/>
<input value={userData?.phone || ""} readOnly className="input"/>
</div>

<input
placeholder="Alternate Mobile Number"
value={alternatePhone}
onChange={(e)=>setAlternatePhone(e.target.value)}
className="input w-full"
/>

<select
value={printType}
onChange={(e)=>setPrintType(e.target.value)}
className="input w-full"
>
<option value="bw">Black & White (₹2)</option>
<option value="color">Color (₹5)</option>
<option value="glossy">Glossy (₹15)</option>
</select>

<select
value={requestType}
onChange={(e)=>setRequestType(e.target.value)}
className="input w-full"
>
<option value="global">⚡ Global Request (Fastest)</option>
<option value="specific">Choose Specific Supplier</option>
</select>

{requestType === "global" && (
<p className="text-sm text-gray-400">
⚡ Your order will be visible to all suppliers. The fastest one will accept it.
</p>
)}

{requestType === "specific" && (

<select
  value={supplier}
  onChange={(e)=>setSupplier(e.target.value)}
  className="input w-full"
>
  <option value="">Select Supplier</option>

  {suppliers.map((s)=>(
    <option key={s.firebaseUID} value={s.firebaseUID}>
      {s.name} | {s.branch} Year {s.year}
    </option>
  ))}

</select>

)}

<div className="flex items-center gap-3">
<input
type="checkbox"
checked={duplex}
onChange={()=>setDuplex(!duplex)}
/>
<span>Duplex Printing</span>
</div>

<textarea
placeholder="Instructions for supplier..."
value={instruction}
onChange={(e)=>setInstruction(e.target.value)}
className="input w-full h-24"
/>

<input
type="file"
required
onChange={(e)=>setFile(e.target.files?.[0] || null)}
/>

<button
type="submit"
disabled={submitting}
className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:scale-105 transition disabled:opacity-50"
>
{submitting ? "Processing..." : "Submit Order"}
</button>

</form>

)}

</div>

{/* ORDER ACTIVITY */}

<div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-xl">

<h2 className="text-2xl font-semibold mb-6">
Order Activity
</h2>

<div className="flex gap-3 mb-6 flex-wrap">

{["day","week","month","year","all"].map(d=>(

<button
key={d}
onClick={()=>setDuration(d)}
className={`px-4 py-2 rounded-lg border ${
duration===d
?"bg-indigo-500 border-indigo-500"
:"border-white/20 text-gray-300"
}`}
>
{d.toUpperCase()}
</button>

))}

</div>

{orders.length>0 ? (

<ResponsiveContainer width="100%" height={320}>

<AreaChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" stroke="#333"/>

<XAxis dataKey="label"/>

<YAxis/>

<Tooltip/>

<Area
type="monotone"
dataKey="orders"
stroke="#6366f1"
fill="#6366f1"
fillOpacity={0.25}
/>

</AreaChart>

</ResponsiveContainer>

) : (

<p className="text-gray-400">No activity yet.</p>

)}

</div>

</div>

{/* PROFILE MODAL */}

{showProfile && (

<div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">

<div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 w-[500px] relative">

<button
onClick={()=>setShowProfile(false)}
className="absolute top-4 right-4"
>
✕
</button>

<h2 className="text-2xl mb-6">My Profile</h2>

<div className="space-y-3 text-gray-300">

<p><strong>Name:</strong> {userData?.name}</p>

<p>
<strong>Email:</strong>
{userData?.email || auth.currentUser?.email}
</p>

<p><strong>Roll:</strong> {userData?.rollNo}</p>

<p><strong>Branch:</strong> {userData?.branch}</p>

<p><strong>Year:</strong> {userData?.year}</p>

<p><strong>Phone:</strong> {userData?.phone}</p>

</div>

</div>

</div>

)}

</div>

</RoleGuard>

)

}
"use client"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

import {
ResponsiveContainer,
LineChart,
Line,
XAxis,
YAxis,
Tooltip,
CartesianGrid
} from "recharts"

export default function SupplierDashboard() {

const [orders,setOrders] = useState<any[]>([])
const [uid,setUid] = useState<string | null>(null)
const [duration,setDuration] = useState("7d")

const loadOrders = async(uid:string)=>{

const res = await fetch(`/api/orders/available?supplierUID=${uid}`)
const data = await res.json()

setOrders(data.orders || [])

}

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(user)=>{

if(!user) return

setUid(user.uid)
loadOrders(user.uid)

})

return ()=>unsubscribe()

},[])


const chartData = orders.map((o,i)=>({
day:`Day ${i+1}`,
orders:1,
revenue:o.estimatedPrice
}))


return(

<div className="max-w-6xl mx-auto p-8 space-y-10">

{/* HEADER */}

<div className="flex justify-between items-center">

<h1 className="text-4xl font-bold">
Supplier Dashboard
</h1>

</div>


{/* FILTER */}

<div className="flex gap-3">

<button
onClick={()=>setDuration("7d")}
className="px-4 py-2 bg-card rounded-lg"
>
7 Days
</button>

<button
onClick={()=>setDuration("30d")}
className="px-4 py-2 bg-card rounded-lg"
>
30 Days
</button>

<button
onClick={()=>setDuration("90d")}
className="px-4 py-2 bg-card rounded-lg"
>
90 Days
</button>

</div>


{/* STATS */}

<div className="grid md:grid-cols-4 gap-6">

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Total Orders</p>
<h2 className="text-3xl font-bold">
{orders.length}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Pending</p>
<h2 className="text-3xl font-bold">
{orders.length}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Revenue</p>
<h2 className="text-3xl font-bold">
₹{orders.reduce((a,b)=>a+b.estimatedPrice,0)}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Avg Order</p>
<h2 className="text-3xl font-bold">
₹{orders.length?Math.round(orders.reduce((a,b)=>a+b.estimatedPrice,0)/orders.length):0}
</h2>
</div>

</div>


{/* ORDERS GRAPH */}

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Orders Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" />

<XAxis dataKey="day" />
<YAxis />
<Tooltip />

<Line
type="monotone"
dataKey="orders"
stroke="#6366f1"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>


{/* REVENUE GRAPH */}

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Revenue Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" />

<XAxis dataKey="day" />
<YAxis />
<Tooltip />

<Line
type="monotone"
dataKey="revenue"
stroke="#22c55e"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

</div>

)

}
"use client"
import { useEffect, useMemo, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

import {
ResponsiveContainer,
LineChart,
Line,
AreaChart,
Area,
PieChart,
Pie,
Cell,
XAxis,
YAxis,
Tooltip,
CartesianGrid,
Legend
} from "recharts"

type SupplierOrder = {
  _id: string
  createdAt: string
  acceptedAt?: string | null
  deliveredAt?: string | null
  status: string
  paymentStatus: string
  estimatedPrice: number
  finalPrice?: number | null
}

type ChartPoint = {
  day: string
  received: number
  accepted: number
  delivered: number
  revenue: number
}

const STATUS_COLORS = ["#60a5fa","#a78bfa","#34d399","#f59e0b","#10b981","#f87171"]

export default function SupplierDashboard() {

const [orders,setOrders] = useState<SupplierOrder[]>([])
const [availableOrders,setAvailableOrders] = useState<SupplierOrder[]>([])
const [loading,setLoading] = useState(true)
const [duration,setDuration] = useState("7d")

const loadOrders = async(uid:string)=>{

try{

const [availableRes,supplierRes] = await Promise.all([
fetch(`/api/orders/available?supplierUID=${uid}`),
fetch(`/api/orders/supplier?supplierUID=${uid}`)
])

const availableData = await availableRes.json()
const supplierData = await supplierRes.json()

setAvailableOrders(availableData.orders || [])
setOrders(supplierData.orders || [])

}finally{
setLoading(false)
}

}

useEffect(()=>{

const unsubscribe = onAuthStateChanged(auth,(user)=>{

if(!user) return

fetch("/api/supplier/sync-email",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body: JSON.stringify({
firebaseUID:user.uid,
email:user.email || user.providerData?.[0]?.email || ""
})
}).catch(()=>{})

loadOrders(user.uid)

})

return ()=>unsubscribe()

},[])

const totalDays = duration === "7d" ? 7 : duration === "30d" ? 30 : 90

const chartData = useMemo(()=>{

const points = new Map<string, ChartPoint>()
const dateList: Date[] = []

for(let i=totalDays-1;i>=0;i--){
const d = new Date()
d.setHours(0,0,0,0)
d.setDate(d.getDate()-i)
dateList.push(d)
}

dateList.forEach((date)=>{
const key = date.toISOString().slice(0,10)
points.set(key,{
day: date.toLocaleDateString(undefined,{month:"short",day:"numeric"}),
received:0,
accepted:0,
delivered:0,
revenue:0
})
})

const addToSeries = (
dateValue:string | undefined | null,
field:keyof Omit<ChartPoint,"day">,
amount = 1
)=>{
if(!dateValue) return
const key = new Date(dateValue).toISOString().slice(0,10)
const point = points.get(key)
if(!point) return
point[field] += amount
}

orders.forEach((order)=>{
addToSeries(order.createdAt,"received",1)

const acceptedStatuses = ["accepted","awaiting_payment","printing","printed","delivered"]
const isAccepted = Boolean(order.acceptedAt) || acceptedStatuses.includes(order.status)
if(isAccepted){
addToSeries(order.acceptedAt || order.createdAt,"accepted",1)
}

if(order.status==="delivered"){
addToSeries(order.deliveredAt || order.createdAt,"delivered",1)
const price = Number(order.finalPrice ?? order.estimatedPrice ?? 0)
addToSeries(order.deliveredAt || order.createdAt,"revenue",price)
}
})

return Array.from(points.values())

},[orders,totalDays])

const totals = useMemo(()=>{
return chartData.reduce((acc,item)=>({
received: acc.received + item.received,
accepted: acc.accepted + item.accepted,
delivered: acc.delivered + item.delivered,
revenue: acc.revenue + item.revenue
}),{
received:0,
accepted:0,
delivered:0,
revenue:0
})
},[chartData])

const statusData = useMemo(()=>{
const map: Record<string, number> = {
accepted: 0,
awaiting_payment: 0,
printing: 0,
printed: 0,
delivered: 0,
cancelled: 0
}

orders.forEach((order)=>{
if(map[order.status] !== undefined){
map[order.status] += 1
}
})

return [
{ name:"Accepted", value: map.accepted },
{ name:"Await Pay", value: map.awaiting_payment },
{ name:"Printing", value: map.printing },
{ name:"Printed", value: map.printed },
{ name:"Delivered", value: map.delivered },
{ name:"Cancelled", value: map.cancelled }
].filter(item=>item.value>0)
},[orders])

const avgOrderValue =
totals.delivered > 0
? Math.round(totals.revenue / totals.delivered)
: 0


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
<p className="text-gray-400">Available Now</p>
<h2 className="text-3xl font-bold">
{availableOrders.length}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Orders Got ({duration})</p>
<h2 className="text-3xl font-bold">
{totals.received}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Accepted ({duration})</p>
<h2 className="text-3xl font-bold">
{totals.accepted}
</h2>
</div>

<div className="bg-card p-6 rounded-xl">
<p className="text-gray-400">Revenue ({duration})</p>
<h2 className="text-3xl font-bold">
₹{totals.revenue}
</h2>
</div>

</div>

{loading && (
<p className="text-gray-400">Loading dashboard data...</p>
)}


{/* ORDERS GRAPH */}

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Orders Got Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" />

<XAxis dataKey="day" />
<YAxis />
<Tooltip />

<Line
type="monotone"
dataKey="received"
stroke="#6366f1"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>


{/* REVENUE GRAPH */}

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Accepted Orders Trend
</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" />

<XAxis dataKey="day" />
<YAxis />
<Tooltip />

<Line
type="monotone"
dataKey="accepted"
stroke="#22c55e"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Revenue Trend (Delivered Only)
</h2>

<ResponsiveContainer width="100%" height={300}>

<AreaChart data={chartData}>

<CartesianGrid strokeDasharray="3 3" />
<XAxis dataKey="day" />
<YAxis />
<Tooltip />

<Area
type="monotone"
dataKey="revenue"
stroke="#f59e0b"
fill="#f59e0b"
fillOpacity={0.25}
strokeWidth={3}
/>

</AreaChart>

</ResponsiveContainer>

</div>

<div className="bg-card p-6 rounded-xl">

<h2 className="text-xl mb-4">
Order Status Distribution
</h2>

<ResponsiveContainer width="100%" height={300}>
<PieChart>
<Pie
data={statusData}
dataKey="value"
nameKey="name"
cx="50%"
cy="50%"
innerRadius={75}
outerRadius={110}
paddingAngle={3}
>
{statusData.map((entry,index)=>(
<Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
))}
</Pie>
<Tooltip />
<Legend />
</PieChart>
</ResponsiveContainer>

<div className="mt-4 text-sm text-gray-300">
Delivered: <span className="font-semibold">{totals.delivered}</span> | Avg Delivered Order Value: <span className="font-semibold">₹{avgOrderValue}</span>
</div>

</div>

</div>

)

}

"use client"

import SupplierGuard from "@/components/SupplierGuard"
import { useEffect,useState } from "react"
import { auth } from "@/lib/firebase"

export default function SupplierOrders(){

const [orders,setOrders] = useState<any[]>([])

useEffect(()=>{

const load = async()=>{

const user = auth.currentUser
if(!user) return

const res = await fetch(`/api/orders/available?supplierUID=${user.uid}`)
const data = await res.json()

setOrders(data.orders || [])

}

load()

},[])

return(

<SupplierGuard>

<div className="max-w-5xl mx-auto p-10">

<h1 className="text-3xl mb-10">
All Orders
</h1>

{orders.map(order=>(

<div
key={order._id}
className="bg-card p-6 rounded-xl mb-4"
>

<p>Pages: {order.pages}</p>

<p>Print Type: {order.printType}</p>

<p>Price: ₹{order.estimatedPrice}</p>

<a
href={order.fileURL}
target="_blank"
className="text-indigo-400"
>
Preview File
</a>

</div>

))}

</div>

</SupplierGuard>

)

}
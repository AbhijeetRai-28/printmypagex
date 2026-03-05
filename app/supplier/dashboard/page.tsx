"use client"

import SupplierGuard from "@/components/SupplierGuard"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { pusherClient } from "@/lib/pusher-client"

export default function SupplierDashboard() {

const [orders,setOrders] = useState<any[]>([])
const [uid,setUid] = useState<string | null>(null)

const loadOrders = async(uid:string)=>{

const res = await fetch(
`/api/orders/available?supplierUID=${uid}`
)

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


useEffect(()=>{

const channel = pusherClient.subscribe("orders")

channel.bind("new-order",(data:any)=>{
setOrders(prev=>[data,...prev])
})

channel.bind("order-accepted",(data:any)=>{
setOrders(prev=>prev.filter(o=>o._id!==data.orderId))
})

return ()=>{
pusherClient.unsubscribe("orders")
}

},[])


const acceptOrder = async(id:string)=>{

if(!uid) return

await fetch("/api/orders/accept",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
orderId:id,
supplierUID:uid
})
})

}

return(

<SupplierGuard>

<div className="max-w-5xl mx-auto p-8">

<h1 className="text-4xl font-bold mb-8">
Supplier Dashboard
</h1>

{orders.length === 0 ? (

<p className="text-gray-400">
No orders available right now
</p>

):( 

orders.map(order=>(

<div
key={order._id}
className="border border-white/10 p-5 rounded-xl mb-4"
>

<p>Pages: {order.pages}</p>
<p>Print Type: {order.printType}</p>
<p>Estimated Price: ₹{order.estimatedPrice}</p>

<button
onClick={()=>acceptOrder(order._id)}
className="mt-3 bg-primary px-4 py-2 rounded-lg"
>
Accept Order
</button>

</div>

))

)}

</div>

</SupplierGuard>

)

}
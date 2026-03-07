"use client"

import SupplierGuard from "@/components/SupplierGuard"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SupplierOrders(){
const router = useRouter()

useEffect(()=>{
router.replace("/supplier/orders")

},[])

return(

<SupplierGuard>
<div className="max-w-5xl mx-auto p-10">
Redirecting to supplier orders...
</div>

</SupplierGuard>

)

}

"use client"

import SupplierNavbar from "@/components/SupplierNavbar"
import SupplierGuard from "@/components/SupplierGuard"

export default function SupplierLayout({
 children
}:{
 children:React.ReactNode
}){

return(

<SupplierGuard>

<div className="min-h-screen bg-black text-white">

<SupplierNavbar/>

<div className="max-w-6xl mx-auto p-8">
{children}
</div>

</div>

</SupplierGuard>

)

}
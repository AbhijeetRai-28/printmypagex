"use client"

import SupplierNavbar from "@/components/SupplierNavbar"

export default function SupplierLayout({
  children
}:{
  children:React.ReactNode
}){

return(

<div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white">

<SupplierNavbar/>

{/* wider container */}

<div className="max-w-[1500px] mx-auto px-8 py-10">
{children}
</div>

</div>

)

}
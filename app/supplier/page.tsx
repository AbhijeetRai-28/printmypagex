"use client"

import Link from "next/link"

export default function SupplierHome(){

return(

<div className="min-h-screen flex items-center justify-center p-6">

<div className="max-w-xl text-center space-y-6 bg-card p-10 rounded-2xl">

<h1 className="text-4xl font-bold text-gradient">
PrintMyPage Supplier Program
</h1>

<p className="text-white/70">
Earn money by printing documents for students on campus.
Accept orders, print documents, and get paid.
</p>

<div className="flex gap-4 justify-center">

<Link
href="/supplier/register"
className="px-6 py-3 bg-primary rounded-xl hover:scale-105"
>
Become a Supplier
</Link>

<Link
href="/supplier/login"
className="px-6 py-3 border border-white/20 rounded-xl hover:bg-white/10"
>
Supplier Login
</Link>

</div>

</div>

</div>

)

}
"use client"

import Navbar from "@/components/Navbar"

export default function PricingPage() {

const plans = [
{
title:"Black & White",
price:"₹2 / page",
desc:"Standard document printing",
features:[
"A4 printing",
"Clear text quality",
"Fast processing"
]
},
{
title:"Color Print",
price:"₹5 / page",
desc:"High quality color prints",
features:[
"Color graphics",
"Charts & diagrams",
"Project reports"
]
},
{
title:"Glossy Print",
price:"₹15 / page",
desc:"Premium glossy printing",
features:[
"Photos",
"Posters",
"Presentation covers"
]
}
]

return (

<div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">

<Navbar/>

<div className="max-w-6xl mx-auto px-6 py-20">

<h1 className="text-4xl font-bold text-center mb-6">
Simple Transparent Pricing
</h1>

<p className="text-center text-gray-500 dark:text-gray-400 mb-16">
No hidden fees. Pay only for what you print.
</p>

<div className="grid md:grid-cols-3 gap-8">

{plans.map((plan,i)=>(
<div
key={i}
className="border border-gray-200 dark:border-gray-700 rounded-2xl p-8 bg-gray-50 dark:bg-[#0f0f1a] hover:scale-105 transition"
>

<h2 className="text-2xl font-semibold mb-2">
{plan.title}
</h2>

<p className="text-3xl font-bold text-indigo-500 mb-4">
{plan.price}
</p>

<p className="text-gray-500 dark:text-gray-400 mb-6">
{plan.desc}
</p>

<ul className="space-y-2 text-sm">

{plan.features.map((f,j)=>(
<li key={j}>✔ {f}</li>
))}

</ul>

</div>
))}

</div>

</div>

</div>

)
}
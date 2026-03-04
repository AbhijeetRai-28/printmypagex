"use client"

import Navbar from "@/components/Navbar"

export default function ContactPage(){

return(

<div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">

<Navbar/>

<div className="max-w-4xl mx-auto px-6 py-20">

<h1 className="text-4xl font-bold text-center mb-8">
Contact Us
</h1>

<p className="text-center text-gray-500 dark:text-gray-400 mb-16">
Have questions about printing or suppliers? We're here to help.
</p>

<div className="grid md:grid-cols-2 gap-10">

{/* Contact Info */}

<div className="space-y-6">

<div>
<h3 className="font-semibold text-lg">Email</h3>
<p className="text-gray-500 dark:text-gray-400">
support@printmypage.com
</p>
</div>

<div>
<h3 className="font-semibold text-lg">Campus Pickup</h3>
<p className="text-gray-500 dark:text-gray-400">
CS3C - CS3H(hidden goals) <br /> ~ No fixed location ,always runnig to get last seat in next lecture 
</p>
</div>

<div>
<h3 className="font-semibold text-lg">Support Hours</h3>
<p className="text-gray-500 dark:text-gray-400">
9 AM – 5 PM (Campus Days) 
</p>
</div>

</div>

{/* Contact Form */}

<form className="space-y-6">

<input
type="text"
placeholder="Your Name"
className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
/>

<input
type="email"
placeholder="Your Email"
className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent"
/>

<textarea
placeholder="Message"
className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent h-32"
/>

<button
type="submit"
className="px-6 py-3 rounded-xl bg-indigo-500 text-white hover:opacity-90"
>
Send Message
</button>

</form>

</div>

</div>

</div>

)
}
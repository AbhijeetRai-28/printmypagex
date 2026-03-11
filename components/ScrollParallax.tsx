"use client"

import { useEffect } from "react"

export default function ScrollParallax(){

useEffect(()=>{

const elements = document.querySelectorAll("[data-scroll-speed]")

const handleScroll = () => {

const scrollY = window.scrollY

elements.forEach((el:any)=>{

const speed = el.dataset.scrollSpeed || 0.2

const y = scrollY * speed

el.style.transform = `translate3d(0,${y}px,0)`

})

}

window.addEventListener("scroll",handleScroll)

return ()=>window.removeEventListener("scroll",handleScroll)

},[])

return null
}
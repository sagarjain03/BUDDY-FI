import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'

const Circle = ({ position, round, height, width }) => {
  const circleRef = useRef(null)

  useEffect(() => {
    // Wobble effect using GSAP
    gsap.to(circleRef.current, {
      x: '+=10', 
      y: '+=10', 
      repeat: -1, 
      yoyo: true, 
      ease: 'sine.inOut',
      duration: 0.5,
    })
  }, [])

  return (
    <div
      ref={circleRef}
      className={`bg-orange-400 z-0 ${height} ${width} ${round} shadow-lg blur-lg absolute ${position}`}
    ></div>
  )
}

export default Circle

"use client"

import React, { useRef, useEffect, useState } from "react"

interface PhotoFrameProps {
  src: string // image to render inside frame
  maxWidth?: number
  maxHeight?: number
}

const Canvas: React.FC<PhotoFrameProps> = ({ src, maxWidth = 300, maxHeight = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Responsive sizing
    const updateCanvasDims = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const width = Math.min(parent.clientWidth * 0.8, maxWidth)
      const height = Math.min(parent.clientHeight * 0.5, maxHeight)
      setCanvasDims({ width, height })
    }

    updateCanvasDims()
    window.addEventListener("resize", updateCanvasDims)
    return () => window.removeEventListener("resize", updateCanvasDims)
  }, [maxWidth, maxHeight])

useEffect(() => {
  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  // Fill white background first
  ctx.fillStyle = "white"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const img = new Image()
  img.src = src
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // Draw frame border
    ctx.strokeStyle = "rgba(0,0,0,0.5)"
    ctx.lineWidth = 4
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
  }
}, [src, canvasDims])


  return (
    <canvas
      ref={canvasRef}
      width={canvasDims.width}
      height={canvasDims.height}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md"
    />
  )
}

export default Canvas

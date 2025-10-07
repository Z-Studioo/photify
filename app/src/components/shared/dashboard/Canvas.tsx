"use client"

import React, { useRef, useEffect, useState } from "react"
import { useUpload, type CanvasShape } from "@/context/UploadContext"

interface PhotoFrameProps {
  src: string // image to render inside frame
  maxWidth?: number
  maxHeight?: number
}

const Canvas: React.FC<PhotoFrameProps> = ({ src, maxWidth = 300, maxHeight = 300 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasDims, setCanvasDims] = useState({ width: 0, height: 0 })
  const { shape } = useUpload()

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

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  const frameWidth = 12 // Frame thickness
  const radius = Math.min(canvas.width, canvas.height) / 2 - frameWidth

  // Draw shadow first (behind everything)
  drawRealisticShadow(ctx, centerX, centerY, radius, shape)

  // Create and draw the frame background
  drawFrameBackground(ctx, centerX, centerY, radius, frameWidth, shape)

  // Create clipping path for image based on shape
  ctx.save()
  
  switch (shape) {
    case 'rectangle':
      const innerWidth = canvas.width - frameWidth * 2
      const innerHeight = canvas.height - frameWidth * 2
      ctx.rect(frameWidth, frameWidth, innerWidth, innerHeight)
      break
    case 'round':
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - frameWidth/2, 0, 2 * Math.PI)
      break
    case 'hexagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth/2, 6)
      break
    case 'octagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth/2, 8)
      break
    case 'dodecagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth/2, 12)
      break
  }
  
  ctx.clip()

  const img = new Image()
  img.src = src
  img.onload = () => {
    // Draw image within clipped area
    if (shape === 'rectangle') {
      const innerWidth = canvas.width - frameWidth * 2
      const innerHeight = canvas.height - frameWidth * 2
      ctx.drawImage(img, frameWidth, frameWidth, innerWidth, innerHeight)
    } else {
      // For circular and polygon shapes, center the image
      const imageSize = (radius - frameWidth/2) * 2
      const x = centerX - imageSize/2
      const y = centerY - imageSize/2
      ctx.drawImage(img, x, y, imageSize, imageSize)
    }
    
    ctx.restore()
    
    // Draw realistic frame edges and highlights
    drawFrameDetails(ctx, centerX, centerY, radius, frameWidth, shape)
  }
}, [src, canvasDims, shape])

// Helper function to draw polygons
const drawPolygon = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, sides: number, strokeOnly = false) => {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides - Math.PI / 2
    const x = centerX + radius * Math.cos(angle)
    const y = centerY + radius * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  if (strokeOnly) {
    ctx.stroke()
  }
}

// Draw realistic shadow effect
const drawRealisticShadow = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, shape: CanvasShape) => {
  ctx.save()
  
  // Create shadow gradient
  const shadowOffset = 8
  const shadowBlur = 15
  
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)"
  ctx.shadowBlur = shadowBlur
  ctx.shadowOffsetX = shadowOffset
  ctx.shadowOffsetY = shadowOffset
  
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
  
  switch (shape) {
    case 'rectangle':
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      break
    case 'round':
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fill()
      break
    case 'hexagon':
      drawPolygon(ctx, centerX, centerY, radius, 6)
      ctx.fill()
      break
    case 'octagon':
      drawPolygon(ctx, centerX, centerY, radius, 8)
      ctx.fill()
      break
    case 'dodecagon':
      drawPolygon(ctx, centerX, centerY, radius, 12)
      ctx.fill()
      break
  }
  
  ctx.restore()
}

// Draw frame background with gradient
const drawFrameBackground = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, frameWidth: number, shape: CanvasShape) => {
  ctx.save()
  
  // Create frame gradient (simulating wood or metal frame)
  const gradient = ctx.createLinearGradient(0, 0, frameWidth, frameWidth)
  gradient.addColorStop(0, "#8B4513")   // Dark brown
  gradient.addColorStop(0.3, "#CD853F") // Sandy brown
  gradient.addColorStop(0.7, "#A0522D") // Sienna
  gradient.addColorStop(1, "#654321")   // Dark brown
  
  ctx.fillStyle = gradient
  
  switch (shape) {
    case 'rectangle':
      // Draw outer frame
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // Cut out inner area
      ctx.globalCompositeOperation = 'destination-out'
      const innerWidth = ctx.canvas.width - frameWidth * 2
      const innerHeight = ctx.canvas.height - frameWidth * 2
      ctx.fillRect(frameWidth, frameWidth, innerWidth, innerHeight)
      break
    default:
      // For circular and polygon shapes
      ctx.beginPath()
      
      if (shape === 'round') {
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      } else {
        const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : 12
        drawPolygon(ctx, centerX, centerY, radius, sides)
      }
      
      ctx.fill()
      
      // Cut out inner area
      ctx.globalCompositeOperation = 'destination-out'
      ctx.beginPath()
      
      if (shape === 'round') {
        ctx.arc(centerX, centerY, radius - frameWidth, 0, 2 * Math.PI)
      } else {
        const sides = shape === 'hexagon' ? 6 : shape === 'octagon' ? 8 : 12
        drawPolygon(ctx, centerX, centerY, radius - frameWidth, sides)
      }
      
      ctx.fill()
      break
  }
  
  ctx.restore()
}

// Draw frame details and highlights
const drawFrameDetails = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, radius: number, frameWidth: number, shape: CanvasShape) => {
  ctx.save()
  
  // Inner bevel highlight
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)"
  ctx.lineWidth = 2
  
  switch (shape) {
    case 'rectangle':
      const innerWidth = ctx.canvas.width - frameWidth * 2
      const innerHeight = ctx.canvas.height - frameWidth * 2
      ctx.strokeRect(frameWidth + 1, frameWidth + 1, innerWidth - 2, innerHeight - 2)
      break
    case 'round':
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - frameWidth + 1, 0, 2 * Math.PI)
      ctx.stroke()
      break
    case 'hexagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 6, true)
      break
    case 'octagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 8, true)
      break
    case 'dodecagon':
      drawPolygon(ctx, centerX, centerY, radius - frameWidth + 1, 12, true)
      break
  }
  
  // Outer edge shadow
  ctx.strokeStyle = "rgba(0, 0, 0, 0.3)"
  ctx.lineWidth = 1
  
  switch (shape) {
    case 'rectangle':
      ctx.strokeRect(1, 1, ctx.canvas.width - 2, ctx.canvas.height - 2)
      break
    case 'round':
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI)
      ctx.stroke()
      break
    case 'hexagon':
      drawPolygon(ctx, centerX, centerY, radius - 1, 6, true)
      break
    case 'octagon':
      drawPolygon(ctx, centerX, centerY, radius - 1, 8, true)
      break
    case 'dodecagon':
      drawPolygon(ctx, centerX, centerY, radius - 1, 12, true)
      break
  }
  
  ctx.restore()
}


  return (
    <canvas
      ref={canvasRef}
      width={canvasDims.width}
      height={canvasDims.height}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
    />
  )
}

export default Canvas

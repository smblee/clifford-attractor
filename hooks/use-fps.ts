import { useEffect, useRef, useState } from "react"

// Hook to track FPS (frames per second)
export function useFPS(updateInterval: number = 500) {
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const calculateFPS = () => {
      const now = performance.now()
      frameCountRef.current++

      // Update FPS every updateInterval milliseconds
      if (now >= lastTimeRef.current + updateInterval) {
        const deltaTime = now - lastTimeRef.current
        const currentFps = Math.round((frameCountRef.current * 1000) / deltaTime)
        
        setFps(currentFps)
        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animationFrameRef.current = requestAnimationFrame(calculateFPS)
    }

    animationFrameRef.current = requestAnimationFrame(calculateFPS)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateInterval])

  return fps
}


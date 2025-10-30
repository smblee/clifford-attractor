"use client"

import { useFrame } from "@react-three/fiber"
import { useEffect, useRef } from "react"
import * as THREE from "three"
import { type AudioData, attractorRegistry } from "./attractors"

// Props for the universal attractor component
export interface UniversalAttractorProps {
  type: string
  params: Record<string, number>
  audioReactive?: boolean
  audioData?: AudioData
  opacity?: number // Control opacity for blend modes
}

// Universal attractor component that handles all types
export function UniversalAttractor({
  type,
  params,
  audioReactive = false,
  audioData = { bass: 0, mid: 0, high: 0, volume: 0 },
  opacity = 0.4, // Default opacity
}: UniversalAttractorProps) {
  // Get the attractor configuration from registry first
  const attractorConfig = attractorRegistry[type]

  // Initialize refs BEFORE any conditional returns (React hooks rule)
  const pointsRef = useRef<THREE.Points>(null)
  const currentParams = useRef({ ...params })
  const targetParams = useRef({ ...params })

  // Use default iterations if config doesn't exist (will be checked later)
  const iterations = attractorConfig?.iterations ?? 50000

  // Initialize buffer refs (will be resized if needed below)
  const positionsRef = useRef<Float32Array>(new Float32Array(iterations * 3))
  const colorsRef = useRef<Float32Array>(new Float32Array(iterations * 3))
  const needsInitialCalculation = useRef(true)

  // Ensure buffers are correctly sized BEFORE render (synchronous, not in useEffect)
  if (positionsRef.current.length !== iterations * 3) {
    positionsRef.current = new Float32Array(iterations * 3)
    colorsRef.current = new Float32Array(iterations * 3)
    needsInitialCalculation.current = true
  }

  // Update parameters when they change
  useEffect(() => {
    // On type change, reset immediately (no lerping)
    // On param change within same type, update target for lerping
    currentParams.current = { ...params }
    targetParams.current = { ...params }
    needsInitialCalculation.current = true
  }, [params])

  // Apply audio reactivity on top of base params
  useEffect(() => {
    if (!attractorConfig) return

    if (audioReactive && attractorConfig.audioMappings && attractorConfig.audioMappings.length > 0) {
      // Use custom audio mappings defined by the attractor
      const newParams: Record<string, number> = { ...params }

      attractorConfig.audioMappings.forEach((mapping) => {
        if (params[mapping.param] !== undefined) {
          const audioValue = audioData[mapping.band]
          // Apply the audio modulation with the specified intensity
          newParams[mapping.param] = params[mapping.param] + audioValue * mapping.intensity
        }
      })

      targetParams.current = newParams
    } else {
      targetParams.current = { ...params }
    }
  }, [params, audioReactive, audioData, attractorConfig])

  // Perform initial calculation when type or iterations change
  useEffect(() => {
    if (!attractorConfig) return

    // Buffers are already correctly sized (done synchronously above)
    const positions = positionsRef.current
    const colors = colorsRef.current
    const current = currentParams.current

    // Only calculate if we have valid parameters or it's a parameter-less attractor
    const hasValidParams =
      Object.keys(current).length > 0 || type === "sprott-a" || type === "sprott-b" || type === "sprott-c"

    if (hasValidParams) {
      // Perform initial calculation (without audio reactivity for initial state)
      attractorConfig.calculate(
        positions,
        colors,
        current,
        iterations,
        false, // Don't apply audio reactivity on initial calculation
        { bass: 0, mid: 0, high: 0, volume: 0 },
      )

      // Force geometry update on next render
      if (pointsRef.current) {
        const geometry = pointsRef.current.geometry
        if (geometry.attributes.position) {
          geometry.attributes.position.needsUpdate = true
        }
        if (geometry.attributes.color) {
          geometry.attributes.color.needsUpdate = true
        }
      }
    }
  }, [type, iterations, attractorConfig])

  // Animation frame update - must be called before conditional return
  useFrame(() => {
    if (!pointsRef.current || !attractorConfig) return

    // Higher lerp speeds for better responsiveness
    // Audio reactive needs to be very fast to feel real-time
    const lerpSpeed = audioReactive ? 0.5 : 0.25
    const current = currentParams.current
    const target = targetParams.current

    // Smoothly interpolate all parameters that exist in target
    Object.keys(target).forEach((key) => {
      if (current[key] !== undefined && target[key] !== undefined) {
        current[key] = THREE.MathUtils.lerp(current[key], target[key], lerpSpeed)
      } else {
        current[key] = target[key]
      }
    })

    // Remove any keys from current that aren't in target (attractor type changed)
    Object.keys(current).forEach((key) => {
      if (target[key] === undefined) {
        delete current[key]
      }
    })

    const positions = positionsRef.current
    const colors = colorsRef.current

    // Only calculate if we have valid parameters or it's a parameter-less attractor
    const hasValidParams =
      Object.keys(current).length > 0 || type === "sprott-a" || type === "sprott-b" || type === "sprott-c"

    if (!hasValidParams) {
      return
    }

    // Calculate points using the attractor's calculation function
    attractorConfig.calculate(positions, colors, current, iterations, audioReactive, audioData)

    // Update geometry attributes
    const geometry = pointsRef.current.geometry
    if (geometry.attributes.position) {
      geometry.attributes.position.needsUpdate = true
    }
    if (geometry.attributes.color) {
      geometry.attributes.color.needsUpdate = true
    }

    // Mark initial calculation as complete
    needsInitialCalculation.current = false

    // Rotate the attractor
    const rotationSpeed = audioReactive ? 0.001 + audioData.volume * 0.005 : 0.001
    pointsRef.current.rotation.z += rotationSpeed

    // Add slight rotation on other axes for 3D attractors
    if (attractorConfig.dimension === "3D") {
      pointsRef.current.rotation.x += rotationSpeed * 0.5
      pointsRef.current.rotation.y += rotationSpeed * 0.3
    }
  })

  // Check if config exists AFTER all hooks are called
  if (!attractorConfig) {
    // Unknown attractor type - return null but hooks were already called
    return null
  }

  const pointSize = audioReactive ? 0.008 + audioData.bass * 0.01 : 0.008

  return (
    <points ref={pointsRef}>
      {/* Key forces remount when buffer size changes, preventing stale geometry references */}
      <bufferGeometry key={iterations}>
        <bufferAttribute
          attach="attributes-position"
          count={iterations}
          array={positionsRef.current}
          itemSize={3}
          args={[positionsRef.current, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={iterations}
          array={colorsRef.current}
          itemSize={3}
          args={[colorsRef.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

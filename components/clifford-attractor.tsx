"use client"

import { useRef, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

interface CliffordAttractorProps {
  a: number
  b: number
  c: number
  d: number
  audioReactive?: boolean
  audioData?: {
    bass: number
    mid: number
    high: number
    volume: number
  }
}

export function CliffordAttractor({
  a,
  b,
  c,
  d,
  audioReactive = false,
  audioData = { bass: 0, mid: 0, high: 0, volume: 0 },
}: CliffordAttractorProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const currentParams = useRef({ a, b, c, d })
  const targetParams = useRef({ a, b, c, d })
  const positionsRef = useRef<Float32Array | null>(null)
  const colorsRef = useRef<Float32Array | null>(null)
  const iterations = 75000

  useEffect(() => {
    if (audioReactive) {
      targetParams.current = {
        a: a + audioData.bass * 0.5,
        b: b + audioData.mid * 0.5,
        c: c + audioData.high * 0.3,
        d: d + audioData.volume * 0.3,
      }
    } else {
      targetParams.current = { a, b, c, d }
    }
  }, [a, b, c, d, audioReactive, audioData])

  useEffect(() => {
    positionsRef.current = new Float32Array(iterations * 3)
    colorsRef.current = new Float32Array(iterations * 3)
  }, [])

  useFrame(() => {
    const lerpSpeed = audioReactive ? 0.15 : 0.08
    const current = currentParams.current
    const target = targetParams.current

    current.a = THREE.MathUtils.lerp(current.a, target.a, lerpSpeed)
    current.b = THREE.MathUtils.lerp(current.b, target.b, lerpSpeed)
    current.c = THREE.MathUtils.lerp(current.c, target.c, lerpSpeed)
    current.d = THREE.MathUtils.lerp(current.d, target.d, lerpSpeed)

    if (positionsRef.current && colorsRef.current && pointsRef.current) {
      const positions = positionsRef.current
      const colors = colorsRef.current
      const scale = 0.5

      let x = 0
      let y = 0

      for (let i = 0; i < iterations; i++) {
        const xNew = Math.sin(current.a * y) + current.c * Math.cos(current.a * x)
        const yNew = Math.sin(current.b * x) + current.d * Math.cos(current.b * y)

        x = xNew
        y = yNew

        positions[i * 3] = x * scale
        positions[i * 3 + 1] = y * scale
        positions[i * 3 + 2] = 0

        const hue = (Math.atan2(y, x) / Math.PI + 1) * 0.5
        const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
        const lightness = 0.35 + Math.sqrt(x * x + y * y) * 0.08

        const color = new THREE.Color().setHSL(hue, saturation, lightness)
        colors[i * 3] = color.r
        colors[i * 3 + 1] = color.g
        colors[i * 3 + 2] = color.b
      }

      const geometry = pointsRef.current.geometry
      if (geometry.attributes.position) {
        geometry.attributes.position.needsUpdate = true
      }
      if (geometry.attributes.color) {
        geometry.attributes.color.needsUpdate = true
      }

      const rotationSpeed = audioReactive ? 0.001 + audioData.volume * 0.005 : 0.001
      pointsRef.current.rotation.z += rotationSpeed
    }
  })

  const pointSize = audioReactive ? 0.008 + audioData.bass * 0.01 : 0.008

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={iterations}
          array={positionsRef.current || new Float32Array(iterations * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={iterations}
          array={colorsRef.current || new Float32Array(iterations * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={pointSize}
        vertexColors
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

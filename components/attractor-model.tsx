"use client"

import { useRef, useEffect, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { useGLTF } from "@react-three/drei"
import * as THREE from "three"
import { AudioData, attractorRegistry } from "./attractors"

// Blend modes for model/particles visibility
export type BlendMode = "model-primary" | "equal" | "particles-primary"

// Audio target modes
export type AudioTarget = "both" | "model-only" | "particles-only" | "different-bands"

// Props for the attractor model component
export interface AttractorModelProps {
  modelPath: string
  blendMode: BlendMode
  attractorType: string
  attractorParams: Record<string, number>
  audioData: AudioData
  audioReactive: boolean  // Whether audio reactivity is enabled
  audioTarget: AudioTarget
  effectIntensity?: number
  scale?: number
  // Fine-tuning parameters
  particleSize?: number
  particleCount?: number
  surfaceOffset?: number
  // Rotation controls
  rotationX?: number
  rotationY?: number
  rotationZ?: number
}

export function AttractorModel({
  modelPath,
  blendMode,
  attractorType,
  attractorParams,
  audioData,
  audioReactive,
  audioTarget,
  effectIntensity = 1.0,
  scale = 20.0,
  // Fine-tuning parameters with defaults
  particleSize = 0.015,
  particleCount = 10000,
  surfaceOffset = 0.05,
  // Rotation defaults (in radians)
  rotationX = Math.PI / 2,  // 90 degrees
  rotationY = 0,
  rotationZ = 0,
}: AttractorModelProps) {
  // Load the GLB model
  const { scene } = useGLTF(modelPath)
  
  // Refs
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  
  // Attractor data - generated fresh each time params change
  const attractorPositionsRef = useRef<Float32Array>(new Float32Array(50000 * 3))
  const attractorColorsRef = useRef<Float32Array>(new Float32Array(50000 * 3))
  const animationOffsetRef = useRef(0)
  
  // Get attractor config
  const attractorConfig = attractorRegistry[attractorType]

  // Calculate opacity based on blend mode
  const modelOpacity = useMemo(() => {
    switch (blendMode) {
      case "model-primary": return 0.9
      case "equal": return 0.6
      case "particles-primary": return 0.3
      default: return 0.6
    }
  }, [blendMode])

  // Determine if this component should respond to audio
  // Check BOTH that audio is enabled AND that this component is a target
  const shouldReactToAudio = audioReactive && (audioTarget === "both" || audioTarget === "model-only")
  
  // Get audio data - use different bands if needed
  const effectiveAudioData = useMemo(() => {
    if (audioTarget === "different-bands") {
      return {
        bass: audioData.bass,
        mid: audioData.bass * 0.5,
        high: audioData.bass * 0.3,
        volume: audioData.bass,
      }
    }
    return audioData
  }, [audioTarget, audioData])

  // Find mesh in loaded model
  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && !meshRef.current) {
        meshRef.current = child
      }
    })
  }, [scene])

  // Generate attractor positions when params change
  useEffect(() => {
    if (!attractorConfig) return
    
    const positions = attractorPositionsRef.current
    const colors = attractorColorsRef.current
    const iterations = 50000
    
    // Calculate fresh attractor points
    attractorConfig.calculate(
      positions,
      colors,
      attractorParams,
      iterations,
      false,
      { bass: 0, mid: 0, high: 0, volume: 0 }
    )
  }, [attractorConfig, attractorParams])

  // Project particles onto model surface
  const surfaceParticles = useMemo(() => {
    if (!meshRef.current) return null
    
    const mesh = meshRef.current
    const geometry = mesh.geometry
    
    // Get position attribute
    const positionAttribute = geometry.attributes.position
    if (!positionAttribute) return null
    
    const count = Math.min(particleCount, attractorPositionsRef.current.length / 3)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const scales = new Float32Array(count)
    
    // Create rotation matrix for inverse transform
    // We need to transform attractor positions by the INVERSE of the model rotation
    // to compare them in the model's local coordinate space
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.makeRotationFromEuler(new THREE.Euler(-rotationX, -rotationY, -rotationZ))
    
    // Sample attractor points evenly
    const stride = Math.floor((attractorPositionsRef.current.length / 3) / count)
    
    for (let i = 0; i < count; i++) {
      const attractorIndex = i * stride
      
      // Get attractor position (in attractor coordinate space)
      const ax = attractorPositionsRef.current[attractorIndex * 3]
      const ay = attractorPositionsRef.current[attractorIndex * 3 + 1]
      const az = attractorPositionsRef.current[attractorIndex * 3 + 2]
      
      // Scale attractor position to model space
      // Attractor coords are typically -2 to 2, model is scaled by scale param
      const scaleFactor = scale / 4  // Map attractor range to model size
      
      const targetPos = new THREE.Vector3(
        ax * scaleFactor,
        ay * scaleFactor,
        az * scaleFactor
      )
      
      // Apply inverse rotation to transform attractor pos into model's local space
      targetPos.applyMatrix4(rotationMatrix)
      
      // Find closest point on model surface
      // Simple approach: find nearest vertex
      let minDist = Infinity
      let closestPoint = new THREE.Vector3()
      
      // Sample every Nth vertex for performance
      const vertexSampleRate = Math.max(1, Math.floor(positionAttribute.count / 1000))
      
      for (let v = 0; v < positionAttribute.count; v += vertexSampleRate) {
        const vx = positionAttribute.getX(v)
        const vy = positionAttribute.getY(v)
        const vz = positionAttribute.getZ(v)
        
        const dist = targetPos.distanceTo(new THREE.Vector3(vx, vy, vz))
        
        if (dist < minDist) {
          minDist = dist
          closestPoint.set(vx, vy, vz)
        }
      }
      
      // Offset slightly from surface
      positions[i * 3] = closestPoint.x
      positions[i * 3 + 1] = closestPoint.y
      positions[i * 3 + 2] = closestPoint.z
      
      // Get color from attractor
      colors[i * 3] = attractorColorsRef.current[attractorIndex * 3]
      colors[i * 3 + 1] = attractorColorsRef.current[attractorIndex * 3 + 1]
      colors[i * 3 + 2] = attractorColorsRef.current[attractorIndex * 3 + 2]
      
      // Scale variation
      scales[i] = 0.8 + Math.random() * 0.4
    }
    
    return { positions, colors, scales, count }
  }, [meshRef.current, particleCount, scale, rotationX, rotationY, rotationZ, attractorPositionsRef.current])

  // Animate particles when audio is active
  useFrame((state, delta) => {
    if (!particlesRef.current || !surfaceParticles || !meshRef.current) return
    
    // Only animate if audio reactive is enabled
    if (shouldReactToAudio) {
      animationOffsetRef.current += delta * 10  // Animation speed
      
      const geometry = particlesRef.current.geometry
      const positions = geometry.attributes.position
      const originalPositions = surfaceParticles.positions
      
      // Update particles with audio-driven animation
      for (let i = 0; i < surfaceParticles.count; i++) {
        const ox = originalPositions[i * 3]
        const oy = originalPositions[i * 3 + 1]
        const oz = originalPositions[i * 3 + 2]
        
        // Calculate offset based on attractor flow and audio
        const flowOffset = (i / surfaceParticles.count + animationOffsetRef.current) % 1
        const audioBoost = effectiveAudioData.volume * 0.2
        const offset = (surfaceOffset + audioBoost) * effectIntensity
        
        // Pulse outward from surface
        const normal = new THREE.Vector3(ox, oy, oz).normalize()
        positions.setXYZ(
          i,
          ox + normal.x * offset * Math.sin(flowOffset * Math.PI * 2),
          oy + normal.y * offset * Math.sin(flowOffset * Math.PI * 2),
          oz + normal.z * offset * Math.sin(flowOffset * Math.PI * 2)
        )
      }
      
      positions.needsUpdate = true
    }
  })

  // Calculate point size with audio reactivity
  const pointSize = useMemo(() => {
    if (!shouldReactToAudio) return particleSize
    return particleSize * (1 + effectiveAudioData.bass * 0.5)
  }, [particleSize, shouldReactToAudio, effectiveAudioData.bass])

  return (
    <group 
      ref={groupRef} 
      scale={scale}
      rotation={[rotationX, rotationY, rotationZ]}
    >
      {/* Render the model mesh */}
      <primitive object={scene} scale={1}>
        <meshStandardMaterial
          color={0xffffff}
          transparent
          opacity={modelOpacity}
          metalness={0.3}
          roughness={0.7}
        />
      </primitive>
      
      {/* Render projected particles */}
      {surfaceParticles && (
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={surfaceParticles.count}
              array={surfaceParticles.positions}
              itemSize={3}
              args={[surfaceParticles.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              count={surfaceParticles.count}
              array={surfaceParticles.colors}
              itemSize={3}
              args={[surfaceParticles.colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={pointSize}
            vertexColors
            transparent
            opacity={0.8}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      )}
    </group>
  )
}

// Preload the model
useGLTF.preload("/ap.glb")

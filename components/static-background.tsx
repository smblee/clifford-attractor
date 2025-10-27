"use client"

import { useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

// Shader for animated static/noise background
// Uses screen-space coordinates so it doesn't move with the camera
const vertexShader = `
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    // Output in clip space without any transformations
    gl_Position = vec4(position.xy, 0.999, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec2 resolution;
  varying vec2 vUv;
  
  // Simple noise function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Improved noise with time
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Use screen-space coordinates
    vec2 st = vUv * resolution / 10.0; // Scale for grain size
    
    // Multiple layers of noise at different scales with visible animation
    float n1 = noise(st + time * 1.0);        // Base drift
    float n2 = noise(st * 2.0 - time * 0.7);  // Medium drift in opposite direction
    float n3 = noise(st * 4.0 + time * 1.5);  // Fine detail, faster
    
    // Combine noise layers
    float finalNoise = (n1 * 0.5 + n2 * 0.3 + n3 * 0.2);
    
    // Add subtle pulsing to intensity (breathing effect)
    float pulse = sin(time * 0.8) * 0.4 + 0.6; // Oscillates between 0.2 and 1.0, faster
    float dynamicIntensity = intensity * pulse;
    
    // Very subtle - mostly dark with slight grain
    float value = 0.02 + finalNoise * dynamicIntensity;
    
    gl_FragColor = vec4(vec3(value), 1.0);
  }
`

interface StaticBackgroundProps {
  intensity?: number
}

export function StaticBackground({ intensity = 0.03 }: StaticBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { size } = useThree()
  
  // Create uniforms ref to ensure they persist
  const uniforms = useRef({
    time: { value: 0 },
    intensity: { value: intensity },
    resolution: { value: new THREE.Vector2(size.width, size.height) },
  })

  // Animate the static over time and update resolution
  useFrame(({ clock }) => {
    uniforms.current.time.value = clock.getElapsedTime()
    uniforms.current.resolution.value.set(size.width, size.height)
  })

  return (
    <mesh ref={meshRef}>
      {/* Fullscreen quad in clip space */}
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms.current}
        transparent={false}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  )
}


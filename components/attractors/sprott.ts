import * as THREE from "three"
import type { AttractorConfig, AudioData } from "./types"

// Sprott Attractor Case A (3D)
// dx/dt = y
// dy/dt = -x + y·z
// dz/dt = 1 - y²
function calculateSprottA(
  positions: Float32Array,
  colors: Float32Array,
  _params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) {
  const dt = 0.05
  const scale = 0.3

  let x = 0
  let y = 1
  let z = 0

  for (let i = 0; i < iterations; i++) {
    const dx = y
    const dy = -x + y * z
    const dz = 1 - y * y

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color based on position
    const hue = (Math.atan2(y, x) / Math.PI + 1) * 0.5
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.abs(z) * 0.05

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

// Sprott Attractor Case B (3D)
// dx/dt = y·z
// dy/dt = x - y
// dz/dt = 1 - x·y
function calculateSprottB(
  positions: Float32Array,
  colors: Float32Array,
  _params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) {
  const dt = 0.08
  const scale = 0.35

  let x = 0.1
  let y = 0.1
  let z = 0

  for (let i = 0; i < iterations; i++) {
    const dx = y * z
    const dy = x - y
    const dz = 1 - x * y

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color gradient
    const hue = (z * 0.2 + 0.6) % 1
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.sqrt(x * x + y * y) * 0.05

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

// Sprott Attractor Case C (3D)
// dx/dt = y·z
// dy/dt = x - y
// dz/dt = 1 - x²
function calculateSprottC(
  positions: Float32Array,
  colors: Float32Array,
  _params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData,
) {
  const dt = 0.08
  const scale = 0.35

  let x = 0.1
  let y = 0
  let z = 0.5

  for (let i = 0; i < iterations; i++) {
    const dx = y * z
    const dy = x - y
    const dz = 1 - x * x

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color based on height
    const hue = (Math.atan2(z, y) / Math.PI + 1) * 0.5
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.abs(x) * 0.1

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const sprottAConfig: AttractorConfig = {
  name: "Sprott A",
  description: "Simple chaotic system (Case A)",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateSprottA,
  audioMappings: [], // No parameters - Sprott attractors are parameter-free
}

export const sprottBConfig: AttractorConfig = {
  name: "Sprott B",
  description: "Simple chaotic system (Case B)",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateSprottB,
  audioMappings: [], // No parameters - Sprott attractors are parameter-free
}

export const sprottCConfig: AttractorConfig = {
  name: "Sprott C",
  description: "Simple chaotic system (Case C)",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateSprottC,
  audioMappings: [], // No parameters - Sprott attractors are parameter-free
}

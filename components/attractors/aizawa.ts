import * as THREE from "three"
import { AudioData, AttractorConfig } from "./types"

// Aizawa Attractor (3D)
// dx/dt = (z - b)·x - d·y
// dy/dt = d·x + (z - b)·y
// dz/dt = c + a·z - z³/3 - (x² + y²)·(1 + e·z) + f·z·x³
function calculateAizawa(
  positions: Float32Array,
  colors: Float32Array,
  params: Record<string, number>,
  iterations: number,
  audioReactive: boolean,
  audioData: AudioData
) {
  // Use classic Aizawa values as defaults
  const { a = 0.95, b = 0.7, c = 0.6, d = 3.5, e = 0.25, f = 0.1 } = params
  const dt = 0.01
  const scale = 0.3

  let x = 0.1
  let y = 0
  let z = 0

  for (let i = 0; i < iterations; i++) {
    const dx = (z - b) * x - d * y
    const dy = d * x + (z - b) * y
    const dz = c + a * z - (z * z * z) / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x

    x += dx * dt
    y += dy * dt
    z += dz * dt

    positions[i * 3] = x * scale
    positions[i * 3 + 1] = y * scale
    positions[i * 3 + 2] = z * scale

    // Color based on height (z)
    const hue = (z * 0.1 + 0.5) % 1
    const saturation = audioReactive ? 0.7 + audioData.volume * 0.3 : 0.8
    const lightness = 0.35 + Math.abs(z) * 0.03

    const color = new THREE.Color().setHSL(hue, saturation, lightness)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
}

export const aizawaConfig: AttractorConfig = {
  name: "Aizawa",
  description: "Complex 3D attractor",
  dimension: "3D",
  iterations: 50000,
  calculate: calculateAizawa,
  audioMappings: [
    { param: "a", band: "bass", intensity: 0.3 },    // Bass affects main dynamics
    { param: "b", band: "mid", intensity: 0.3 },     // Mid affects torus shape
    { param: "d", band: "high", intensity: 0.4 },    // High affects rotation speed
    { param: "e", band: "volume", intensity: 0.2 },  // Volume affects overall complexity
  ],
}


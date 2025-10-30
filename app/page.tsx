"use client"

import { OrbitControls } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo, useState } from "react"
import { AttractorModel, type AudioTarget, type BlendMode } from "@/components/attractor-model"
import { attractorRegistry } from "@/components/attractors"
import { StaticBackground } from "@/components/static-background"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { UniversalAttractor } from "@/components/universal-attractor"
import { type AudioSource, useAudioAnalyzer } from "@/components/use-audio-analyzer"
import { useFPS } from "@/hooks/use-fps"

// Define attractor types and their configurations
type AttractorType =
  | "clifford"
  | "halvorsen"
  | "aizawa"
  | "peter-de-jong"
  | "rabinovich-fabrikant"
  | "sprott-a"
  | "sprott-b"
  | "sprott-c"

interface AttractorConfig {
  name: string
  type: AttractorType
  description: string
  dimension: "2D" | "3D"
  params: {
    name: string
    key: string
    min: number
    max: number
    step: number
    default: number
  }[]
  presets: { name: string; values: Record<string, number> }[]
}

// Configuration for all attractors
const attractorConfigs: Record<AttractorType, AttractorConfig> = {
  clifford: {
    name: "Clifford",
    type: "clifford",
    description: "Classic 2D strange attractor",
    dimension: "2D",
    params: [
      { name: "a", key: "a", min: -3, max: 3, step: 0.1, default: -1.4 },
      { name: "b", key: "b", min: -3, max: 3, step: 0.1, default: 1.6 },
      { name: "c", key: "c", min: -3, max: 3, step: 0.1, default: 1.0 },
      { name: "d", key: "d", min: -3, max: 3, step: 0.1, default: 0.7 },
    ],
    presets: [
      { name: "Classic", values: { a: -1.4, b: 1.6, c: 1.0, d: 0.7 } },
      { name: "Spiral", values: { a: 1.7, b: 1.7, c: 0.6, d: 1.2 } },
      { name: "Chaotic", values: { a: 1.5, b: -1.8, c: 1.6, d: 0.9 } },
      { name: "Symmetric", values: { a: -1.9, b: -1.9, c: -0.8, d: -1.2 } },
    ],
  },
  halvorsen: {
    name: "Halvorsen",
    type: "halvorsen",
    description: "3D chaotic flow system",
    dimension: "3D",
    params: [{ name: "a", key: "a", min: 0.5, max: 2.5, step: 0.1, default: 1.4 }],
    presets: [
      { name: "Classic", values: { a: 1.4 } },
      { name: "Slow", values: { a: 1.0 } },
      { name: "Fast", values: { a: 1.8 } },
    ],
  },
  aizawa: {
    name: "Aizawa",
    type: "aizawa",
    description: "Complex 3D attractor",
    dimension: "3D",
    params: [
      { name: "a", key: "a", min: 0, max: 2, step: 0.05, default: 0.95 },
      { name: "b", key: "b", min: 0, max: 2, step: 0.1, default: 0.7 },
      { name: "c", key: "c", min: 0, max: 2, step: 0.1, default: 0.6 },
      { name: "d", key: "d", min: 0, max: 5, step: 0.1, default: 3.5 },
      { name: "e", key: "e", min: 0, max: 1, step: 0.05, default: 0.25 },
      { name: "f", key: "f", min: 0, max: 1, step: 0.05, default: 0.1 },
    ],
    presets: [
      { name: "Classic", values: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 } },
      { name: "Variant 1", values: { a: 0.85, b: 0.6, c: 0.5, d: 3.0, e: 0.2, f: 0.15 } },
    ],
  },
  "peter-de-jong": {
    name: "Peter de Jong",
    type: "peter-de-jong",
    description: "Beautiful 2D map attractor",
    dimension: "2D",
    params: [
      { name: "a", key: "a", min: -3, max: 3, step: 0.1, default: 1.4 },
      { name: "b", key: "b", min: -3, max: 3, step: 0.1, default: -2.3 },
      { name: "c", key: "c", min: -3, max: 3, step: 0.1, default: 2.4 },
      { name: "d", key: "d", min: -3, max: 3, step: 0.1, default: -2.1 },
    ],
    presets: [
      { name: "Classic", values: { a: 1.4, b: -2.3, c: 2.4, d: -2.1 } },
      { name: "Flower", values: { a: -0.7, b: 1.8, c: -1.9, d: -0.4 } },
      { name: "Swirl", values: { a: 1.1, b: -1.9, c: 1.9, d: -1.4 } },
      { name: "Web", values: { a: 1.9, b: -1.9, c: 1.5, d: -1.9 } },
    ],
  },
  "rabinovich-fabrikant": {
    name: "Rabinovich-Fabrikant",
    type: "rabinovich-fabrikant",
    description: "3D attractor from plasma physics",
    dimension: "3D",
    params: [
      { name: "α (alpha)", key: "alpha", min: 0, max: 0.5, step: 0.01, default: 0.14 },
      { name: "γ (gamma)", key: "gamma", min: 0, max: 0.5, step: 0.01, default: 0.1 },
    ],
    presets: [
      { name: "Classic", values: { alpha: 0.14, gamma: 0.1 } },
      { name: "Variant 1", values: { alpha: 0.18, gamma: 0.12 } },
      { name: "Variant 2", values: { alpha: 0.12, gamma: 0.08 } },
    ],
  },
  "sprott-a": {
    name: "Sprott A",
    type: "sprott-a",
    description: "Simple chaotic system (Case A)",
    dimension: "3D",
    params: [],
    presets: [{ name: "Default", values: {} }],
  },
  "sprott-b": {
    name: "Sprott B",
    type: "sprott-b",
    description: "Simple chaotic system (Case B)",
    dimension: "3D",
    params: [],
    presets: [{ name: "Default", values: {} }],
  },
  "sprott-c": {
    name: "Sprott C",
    type: "sprott-c",
    description: "Simple chaotic system (Case C)",
    dimension: "3D",
    params: [],
    presets: [{ name: "Default", values: {} }],
  },
}

export default function Page() {
  // State for selected attractor type
  const [attractorType, setAttractorType] = useState<AttractorType>("clifford")

  // State for parameters (generic)
  const [params, setParams] = useState<Record<string, number>>(() => {
    const config = attractorConfigs[attractorType]
    const initial: Record<string, number> = {}
    config.params.forEach((param) => {
      initial[param.key] = param.default
    })
    return initial
  })

  const [audioReactive, setAudioReactive] = useState(false)
  const [audioSource, setAudioSource] = useState<AudioSource>("microphone")
  const { audioData, error: audioError } = useAudioAnalyzer(audioReactive, audioSource)

  // Model integration state
  const [modelEnabled, setModelEnabled] = useState(false)
  const [blendMode, setBlendMode] = useState<BlendMode>("model-primary") // Default to model-primary for cleaner look
  const [audioTarget, setAudioTarget] = useState<AudioTarget>("both")
  const [effectIntensity, setEffectIntensity] = useState(0.8)
  const [modelScale, setModelScale] = useState(20.0) // Default 20x bigger

  // Simplified particle projection parameters
  const [particleSize, setParticleSize] = useState(0.015)
  const [particleCount, setParticleCount] = useState(10000)
  const [surfaceOffset, setSurfaceOffset] = useState(0.05)

  // Rotation controls (in radians)
  const [rotationX, setRotationX] = useState(Math.PI / 2) // 90 degrees
  const [rotationY, setRotationY] = useState(0)
  const [rotationZ, setRotationZ] = useState(0)

  // Track FPS
  const fps = useFPS(50) // Update every 500ms

  // Get current attractor config
  const currentConfig = attractorConfigs[attractorType]

  // Calculate opacity for particles based on blend mode
  const particleOpacity = useMemo(() => {
    if (!modelEnabled) return 0.4
    switch (blendMode) {
      case "model-primary":
        return 0.0 // Hide particles completely when model is primary
      case "equal":
        return 0.15 // Very subtle particles
      case "particles-primary":
        return 0.5
      default:
        return 0.4
    }
  }, [blendMode, modelEnabled])

  // Determine audio data for particles vs model
  const particleAudioData = useMemo(() => {
    if (!audioReactive) return audioData
    if (audioTarget === "model-only") {
      // Particles don't react when model-only
      return { bass: 0, mid: 0, high: 0, volume: 0 }
    }
    if (audioTarget === "different-bands") {
      // Particles get mid/high, model gets bass
      return {
        bass: audioData.mid,
        mid: audioData.mid,
        high: audioData.high,
        volume: audioData.mid + audioData.high,
      }
    }
    // Both or particles-only
    return audioData
  }, [audioReactive, audioTarget, audioData])

  const particleAudioReactive = useMemo(() => {
    return (
      audioReactive && (audioTarget === "both" || audioTarget === "particles-only" || audioTarget === "different-bands")
    )
  }, [audioReactive, audioTarget])

  // Handle attractor type change
  const handleAttractorChange = (newType: AttractorType) => {
    setAttractorType(newType)
    const config = attractorConfigs[newType]
    const newParams: Record<string, number> = {}
    config.params.forEach((param) => {
      newParams[param.key] = param.default
    })
    setParams(newParams)
  }

  // Handle parameter change
  const updateParam = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  // Load preset
  const loadPreset = (preset: { name: string; values: Record<string, number> }) => {
    setParams(preset.values)
  }

  return (
    <div className="h-screen w-full bg-black">
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />

        {/* Subtle static background */}
        <StaticBackground intensity={0.03} />

        {/* Lighting for the model */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Attractor particles */}
        <UniversalAttractor
          type={attractorType}
          params={params}
          audioReactive={particleAudioReactive}
          audioData={particleAudioData}
          opacity={particleOpacity}
        />

        {/* GLB Model with particle projection */}
        {modelEnabled && (
          <AttractorModel
            modelPath="/ap.glb"
            blendMode={blendMode}
            attractorType={attractorType}
            attractorParams={params}
            audioData={audioData}
            audioReactive={audioReactive}
            audioTarget={audioTarget}
            effectIntensity={effectIntensity}
            scale={modelScale}
            particleSize={particleSize}
            particleCount={particleCount}
            surfaceOffset={surfaceOffset}
            rotationX={rotationX}
            rotationY={rotationY}
            rotationZ={rotationZ}
          />
        )}

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>

      {/* Title and instructions */}
      <div className="absolute top-6 left-6 font-mono text-white">
        <h1 className="mb-2 font-bold text-2xl">{currentConfig.name} Attractor</h1>
        <p className="mb-1 text-sm text-white/70">{currentConfig.description}</p>
        <p className="mb-1 text-white/50 text-xs">Drag to rotate • Scroll to zoom</p>
        <p className="text-white/40 text-xs">{attractorRegistry[attractorType].dimension}</p>
      </div>

      {/* FPS indicator */}
      <div className="-translate-x-1/2 absolute top-6 left-1/2 transform rounded-lg border border-white/20 bg-black/80 px-4 py-2 font-mono backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-white/50 text-xs">FPS</span>
          <span
            className={`font-bold text-lg ${fps >= 50 ? "text-green-400" : fps >= 30 ? "text-yellow-400" : "text-red-400"}`}
          >
            {fps}
          </span>
        </div>
      </div>

      {/* Control panel */}
      <div className="absolute top-6 right-6 max-h-[90vh] w-80 overflow-y-auto rounded-lg border border-white/20 bg-black/80 p-6 font-mono backdrop-blur-sm">
        {/* Attractor selector */}
        <div className="mb-6">
          <label className="mb-2 block font-bold text-sm text-white">Attractor Type</label>
          <Select value={attractorType} onValueChange={(value) => handleAttractorChange(value as AttractorType)}>
            <SelectTrigger className="w-full border-white/20 bg-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-white/20 bg-black/95">
              {Object.entries(attractorConfigs).map(([key, config]) => (
                <SelectItem key={key} value={key} className="text-white">
                  {config.name} ({config.dimension})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model integration controls */}
        <div className="mb-6 border-white/20 border-b pb-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <label className="font-bold text-sm text-white">GLB Model Engraving</label>
              <p className="mt-1 text-white/50 text-xs">Engrave attractor onto model</p>
            </div>
            <Switch checked={modelEnabled} onCheckedChange={setModelEnabled} />
          </div>

          {modelEnabled && (
            <div className="mt-4 space-y-4">
              {/* Blend mode selector */}
              <div>
                <label className="mb-2 block font-bold text-white text-xs">Blend Mode</label>
                <Select value={blendMode} onValueChange={(value) => setBlendMode(value as BlendMode)}>
                  <SelectTrigger className="w-full border-white/20 bg-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-black/95">
                    <SelectItem value="model-primary" className="text-white text-xs">
                      Model Primary
                    </SelectItem>
                    <SelectItem value="equal" className="text-white text-xs">
                      Equal Blend
                    </SelectItem>
                    <SelectItem value="particles-primary" className="text-white text-xs">
                      Particles Primary
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1 text-white/40 text-xs">Visual balance</p>
              </div>

              {/* Audio target selector */}
              {audioReactive && (
                <div>
                  <label className="mb-2 block font-bold text-white text-xs">Audio Target</label>
                  <Select value={audioTarget} onValueChange={(value) => setAudioTarget(value as AudioTarget)}>
                    <SelectTrigger className="w-full border-white/20 bg-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-white/20 bg-black/95">
                      <SelectItem value="both" className="text-white text-xs">
                        Both
                      </SelectItem>
                      <SelectItem value="model-only" className="text-white text-xs">
                        Model Only
                      </SelectItem>
                      <SelectItem value="particles-only" className="text-white text-xs">
                        Particles Only
                      </SelectItem>
                      <SelectItem value="different-bands" className="text-white text-xs">
                        Different Bands
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-white/40 text-xs">What reacts to audio</p>
                </div>
              )}

              {/* Effect intensity slider */}
              <div>
                <label className="mb-2 flex justify-between text-white text-xs">
                  <span>Effect Intensity</span>
                  <span className="text-white/70">{effectIntensity.toFixed(2)}</span>
                </label>
                <Slider
                  value={[effectIntensity]}
                  onValueChange={(value) => setEffectIntensity(value[0])}
                  min={0}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </div>

              {/* Model scale slider */}
              <div>
                <label className="mb-2 flex justify-between text-white text-xs">
                  <span>Model Scale</span>
                  <span className="text-white/70">{modelScale.toFixed(1)}x</span>
                </label>
                <Slider
                  value={[modelScale]}
                  onValueChange={(value) => setModelScale(value[0])}
                  min={1}
                  max={20}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Particle projection controls */}
              <div className="border-white/20 border-t pt-4">
                <h4 className="mb-3 font-bold text-white text-xs">Particle Projection</h4>

                {/* Particle Size */}
                <div className="mb-3">
                  <label className="mb-2 flex justify-between text-white text-xs">
                    <span>Particle Size</span>
                    <span className="text-white/70">{particleSize.toFixed(3)}</span>
                  </label>
                  <Slider
                    value={[particleSize]}
                    onValueChange={(value) => setParticleSize(value[0])}
                    min={0.001}
                    max={0.1}
                    step={0.001}
                    className="w-full"
                  />
                  <p className="mt-1 text-white/40 text-xs">Size of projected particles</p>
                </div>

                {/* Particle Count */}
                <div className="mb-3">
                  <label className="mb-2 flex justify-between text-white text-xs">
                    <span>Particle Count</span>
                    <span className="text-white/70">{particleCount.toLocaleString()}</span>
                  </label>
                  <Slider
                    value={[particleCount]}
                    onValueChange={(value) => setParticleCount(Math.round(value[0]))}
                    min={1000}
                    max={30000}
                    step={1000}
                    className="w-full"
                  />
                  <p className="mt-1 text-white/40 text-xs">Number of particles on surface</p>
                </div>

                {/* Surface Offset */}
                <div className="mb-3">
                  <label className="mb-2 flex justify-between text-white text-xs">
                    <span>Surface Offset</span>
                    <span className="text-white/70">{surfaceOffset.toFixed(3)}</span>
                  </label>
                  <Slider
                    value={[surfaceOffset]}
                    onValueChange={(value) => setSurfaceOffset(value[0])}
                    min={0}
                    max={0.5}
                    step={0.01}
                    className="w-full"
                  />
                  <p className="mt-1 text-white/40 text-xs">Distance from model surface</p>
                </div>

                {/* Rotation Controls */}
                <div className="border-white/20 border-t pt-3">
                  <h5 className="mb-2 font-bold text-white text-xs">Rotation</h5>

                  {/* Rotation X */}
                  <div className="mb-2">
                    <label className="mb-1 flex justify-between text-white text-xs">
                      <span>X-Axis</span>
                      <span className="text-white/70">{((rotationX * 180) / Math.PI).toFixed(0)}°</span>
                    </label>
                    <Slider
                      value={[rotationX]}
                      onValueChange={(value) => setRotationX(value[0])}
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation Y */}
                  <div className="mb-2">
                    <label className="mb-1 flex justify-between text-white text-xs">
                      <span>Y-Axis</span>
                      <span className="text-white/70">{((rotationY * 180) / Math.PI).toFixed(0)}°</span>
                    </label>
                    <Slider
                      value={[rotationY]}
                      onValueChange={(value) => setRotationY(value[0])}
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  {/* Rotation Z */}
                  <div className="mb-2">
                    <label className="mb-1 flex justify-between text-white text-xs">
                      <span>Z-Axis</span>
                      <span className="text-white/70">{((rotationZ * 180) / Math.PI).toFixed(0)}°</span>
                    </label>
                    <Slider
                      value={[rotationZ]}
                      onValueChange={(value) => setRotationZ(value[0])}
                      min={-Math.PI}
                      max={Math.PI}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Audio reactive toggle */}
        <div className="mb-6 border-white/20 border-b pb-6">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <label className="font-bold text-sm text-white">Audio Reactive</label>
              <p className="mt-1 text-white/50 text-xs">React to audio input</p>
            </div>
            <Switch checked={audioReactive} onCheckedChange={setAudioReactive} />
          </div>

          {audioReactive && (
            <>
              <div className="mb-3">
                <label className="mb-2 block font-bold text-white text-xs">Audio Source</label>
                <Select value={audioSource} onValueChange={(value) => setAudioSource(value as AudioSource)}>
                  <SelectTrigger className="w-full border-white/20 bg-white/10 text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-black/95">
                    <SelectItem value="microphone" className="text-white text-xs">
                      🎤 Microphone
                    </SelectItem>
                    <SelectItem value="tab" className="text-white text-xs">
                      🎵 Tab Audio (Music/Video)
                    </SelectItem>
                  </SelectContent>
                </Select>
                {audioSource === "tab" ? (
                  <p className="mt-1 text-white/40 text-xs">Select a tab with audio playing</p>
                ) : (
                  <p className="mt-1 text-white/40 text-xs">Uses your microphone</p>
                )}
              </div>

              {audioError && (
                <div className="mb-3 rounded border border-red-500/30 bg-red-500/20 p-2 text-red-200 text-xs">
                  {audioError}
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/70">
                  <span>Bass</span>
                  <span>{(audioData.bass * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Mid</span>
                  <span>{(audioData.mid * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>High</span>
                  <span>{(audioData.high * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Volume</span>
                  <span>{(audioData.volume * 100).toFixed(0)}%</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Dynamic parameter controls */}
        {currentConfig.params.length > 0 && (
          <div className="mb-6 space-y-4">
            <h3 className="font-bold text-sm text-white">Parameters</h3>
            {currentConfig.params.map((param) => (
              <div key={param.key}>
                <label className="mb-2 flex justify-between text-sm text-white">
                  <span>{param.name}</span>
                  <span className="text-white/70">{(params[param.key] || 0).toFixed(2)}</span>
                </label>
                <Slider
                  value={[params[param.key] || param.default]}
                  onValueChange={(value) => updateParam(param.key, value[0])}
                  min={param.min}
                  max={param.max}
                  step={param.step}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        )}

        {/* Presets */}
        {currentConfig.presets.length > 0 && (
          <div className="border-white/20 border-t pt-6">
            <h3 className="mb-3 font-bold text-sm text-white">Presets</h3>
            <div className="grid grid-cols-2 gap-2">
              {currentConfig.presets.map((preset) => (
                <Button
                  key={preset.name}
                  onClick={() => loadPreset(preset)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

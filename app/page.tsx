"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import { CliffordAttractor } from "@/components/clifford-attractor"
import { useAudioAnalyzer } from "@/components/use-audio-analyzer"
import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

export default function Page() {
  const [a, setA] = useState(-1.4)
  const [b, setB] = useState(1.6)
  const [c, setC] = useState(1.0)
  const [d, setD] = useState(0.7)
  const [audioReactive, setAudioReactive] = useState(false)
  const audioData = useAudioAnalyzer(audioReactive)

  const presets = [
    { name: "Classic", a: -1.4, b: 1.6, c: 1.0, d: 0.7 },
    { name: "Spiral", a: 1.7, b: 1.7, c: 0.6, d: 1.2 },
    { name: "Chaotic", a: 1.5, b: -1.8, c: 1.6, d: 0.9 },
    { name: "Symmetric", a: -1.9, b: -1.9, c: -0.8, d: -1.2 },
  ]

  const loadPreset = (preset: (typeof presets)[0]) => {
    setA(preset.a)
    setB(preset.b)
    setC(preset.c)
    setD(preset.d)
  }

  return (
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} gl={{ antialias: true }}>
        <color attach="background" args={["#000000"]} />
        <CliffordAttractor a={a} b={b} c={c} d={d} audioReactive={audioReactive} audioData={audioData} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          minDistance={2}
          maxDistance={15}
        />
      </Canvas>

      <div className="absolute top-6 left-6 text-white font-mono">
        <h1 className="text-2xl font-bold mb-2">Clifford Attractor</h1>
        <p className="text-sm text-white/70">Drag to rotate • Scroll to zoom</p>
      </div>

      <div className="absolute top-6 right-6 bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg p-6 w-80 font-mono">
        <h2 className="text-white text-lg font-bold mb-4">Parameters</h2>

        <div className="mb-6 pb-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-white text-sm font-bold">Audio Reactive</label>
              <p className="text-xs text-white/50 mt-1">React to microphone input</p>
            </div>
            <Switch checked={audioReactive} onCheckedChange={setAudioReactive} />
          </div>
          {audioReactive && (
            <div className="mt-4 space-y-2 text-xs">
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
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white text-sm flex justify-between mb-2">
              <span>a</span>
              <span className="text-white/70">{a.toFixed(2)}</span>
            </label>
            <Slider
              value={[a]}
              onValueChange={(value) => setA(value[0])}
              min={-3}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm flex justify-between mb-2">
              <span>b</span>
              <span className="text-white/70">{b.toFixed(2)}</span>
            </label>
            <Slider
              value={[b]}
              onValueChange={(value) => setB(value[0])}
              min={-3}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm flex justify-between mb-2">
              <span>c</span>
              <span className="text-white/70">{c.toFixed(2)}</span>
            </label>
            <Slider
              value={[c]}
              onValueChange={(value) => setC(value[0])}
              min={-3}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-white text-sm flex justify-between mb-2">
              <span>d</span>
              <span className="text-white/70">{d.toFixed(2)}</span>
            </label>
            <Slider
              value={[d]}
              onValueChange={(value) => setD(value[0])}
              min={-3}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="text-white text-sm font-bold mb-3">Presets</h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

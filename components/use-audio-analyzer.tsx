"use client"

import { useEffect, useRef, useState } from "react"

export interface AudioData {
  bass: number
  mid: number
  high: number
  volume: number
}

export function useAudioAnalyzer(enabled: boolean) {
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0,
    mid: 0,
    high: 0,
    volume: 0,
  })
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!enabled) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      setAudioData({ bass: 0, mid: 0, high: 0, volume: 0 })
      return
    }

    const initAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyserRef.current = analyser

        const source = audioContext.createMediaStreamSource(stream)
        source.connect(analyser)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        dataArrayRef.current = dataArray

        const analyze = () => {
          if (!analyserRef.current || !dataArrayRef.current) return

          analyserRef.current.getByteFrequencyData(dataArrayRef.current)

          const bassEnd = Math.floor(bufferLength * 0.1)
          const midEnd = Math.floor(bufferLength * 0.4)

          let bassSum = 0
          let midSum = 0
          let highSum = 0
          let totalSum = 0

          for (let i = 0; i < bufferLength; i++) {
            const value = dataArrayRef.current[i] / 255
            totalSum += value

            if (i < bassEnd) {
              bassSum += value
            } else if (i < midEnd) {
              midSum += value
            } else {
              highSum += value
            }
          }

          setAudioData({
            bass: bassSum / bassEnd,
            mid: midSum / (midEnd - bassEnd),
            high: highSum / (bufferLength - midEnd),
            volume: totalSum / bufferLength,
          })

          animationFrameRef.current = requestAnimationFrame(analyze)
        }

        analyze()
      } catch (error) {
        console.error("[v0] Error accessing microphone:", error)
      }
    }

    initAudio()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [enabled])

  return audioData
}

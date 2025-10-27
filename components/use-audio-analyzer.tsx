"use client"

import { useEffect, useRef, useState } from "react"

export interface AudioData {
  bass: number
  mid: number
  high: number
  volume: number
}

export type AudioSource = "microphone" | "tab"

export function useAudioAnalyzer(enabled: boolean, source: AudioSource = "microphone") {
  const [audioData, setAudioData] = useState<AudioData>({
    bass: 0,
    mid: 0,
    high: 0,
    volume: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
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
        setError(null)
        let stream: MediaStream

        if (source === "microphone") {
          // Capture microphone audio
          stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } else {
          // Capture tab/system audio using Screen Capture API
          // Note: Chrome requires video to be specified even for audio-only capture
          stream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            } as MediaTrackConstraints,
          })
          
          // Check if audio track is present
          const audioTracks = stream.getAudioTracks()
          if (audioTracks.length === 0) {
            // Clean up video track if present
            stream.getTracks().forEach(track => track.stop())
            throw new Error("No audio track in selected tab. Make sure to check 'Share audio' and select a tab with audio playing.")
          }
          
          // Stop video track if present (we only need audio)
          const videoTrack = stream.getVideoTracks()[0]
          if (videoTrack) {
            videoTrack.stop()
            stream.removeTrack(videoTrack)
          }
        }

        streamRef.current = stream

        // Verify we have at least one audio track
        const audioTracks = stream.getAudioTracks()
        if (audioTracks.length === 0) {
          throw new Error(`No audio track available from ${source}. Please check your permissions.`)
        }

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 512
        analyserRef.current = analyser

        const audioSource = audioContext.createMediaStreamSource(stream)
        audioSource.connect(analyser)

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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        console.error(`Error accessing ${source}:`, err)
        setError(errorMessage)
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
  }, [enabled, source])

  return { audioData, error }
}

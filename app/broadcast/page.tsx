'use client'

import { useState, useEffect, useRef } from 'react'
import Peer from 'peerjs'

export default function BroadcastPage() {
  const [streamId, setStreamId] = useState<string>('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamType, setStreamType] = useState<'camera' | 'screen'>('camera')
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Generate unique stream ID
    const id = `stream_${Math.random().toString(36).substr(2, 9)}`
    setStreamId(id)
    
    // Initialize PeerJS
    const peer = new Peer(id, {
      host: location.hostname,
      port: location.port || (location.protocol === 'https:' ? 443 : 3001),
      path: '/peerjs',
      debug: 2
    })

    peerRef.current = peer

    peer.on('open', (id) => {
      console.log('My peer ID is: ' + id)
    })

    peer.on('connection', (conn) => {
      conn.on('data', (data) => {
        console.log('Received:', data)
      })
    })

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startStreaming = async () => {
    try {
      let stream: MediaStream
      
      if (streamType === 'camera') {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
      } else {
        stream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
          audio: true
        })
      }

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsStreaming(true)
      
      // Handle incoming calls
      peerRef.current?.on('call', (call) => {
        call.answer(stream)
        call.on('stream', (remoteStream) => {
          console.log('Viewer connected')
        })
      })

    } catch (error) {
      console.error('Error accessing media:', error)
      alert('Fehler beim Zugriff auf Kamera/Bildschirm')
    }
  }

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsStreaming(false)
  }

  const copyStreamId = () => {
    navigator.clipboard.writeText(streamId)
    alert('Stream-ID kopiert! Teilen Sie diese mit Zuschauern.')
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">🎥 Stream Broadcast</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Stream-Einstellungen</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream-Typ
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setStreamType('camera')}
                    className={`px-4 py-2 rounded-lg ${streamType === 'camera' ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    📹 Kamera
                  </button>
                  <button
                    onClick={() => setStreamType('screen')}
                    className={`px-4 py-2 rounded-lg ${streamType === 'screen' ? 'bg-blue-600' : 'bg-gray-700'}`}
                  >
                    🖥️ Bildschirm teilen
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ihre Stream-ID
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={streamId}
                    readOnly
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-4 py-2"
                  />
                  <button
                    onClick={copyStreamId}
                    className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-r-lg"
                  >
                    Kopieren
                  </button>
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  Teilen Sie diese ID mit Zuschauern
                </p>
              </div>

              <div className="pt-4">
                {!isStreaming ? (
                  <button
                    onClick={startStreaming}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
                  >
                    ▶️ Stream starten
                  </button>
                ) : (
                  <button
                    onClick={stopStreaming}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition"
                  >
                    ⏹️ Stream stoppen
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-3">Anleitung</h3>
            <ol className="list-decimal pl-5 space-y-2 text-gray-300">
              <li>Wählen Sie den Stream-Typ (Kamera oder Bildschirm)</li>
              <li>Klicken Sie auf "Stream starten"</li>
              <li>Teilen Sie die Stream-ID mit Zuschauern</li>
              <li>Zuschauer können die ID auf der Watch-Seite eingeben</li>
            </ol>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <h3 className="font-medium">Vorschau</h3>
          </div>
          <div className="aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              muted
              autoPlay
              playsInline
            />
            {!isStreaming && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📹</div>
                  <p>Stream wird hier angezeigt</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${isStreaming ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
              <span>{isStreaming ? 'Live' : 'Offline'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

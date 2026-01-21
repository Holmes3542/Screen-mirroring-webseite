'use client'

import { useState, useRef, useEffect } from 'react'
import Peer from 'peerjs'

export default function WatchPage() {
  const [streamId, setStreamId] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<Peer | null>(null)
  const connectionRef = useRef<any>(null)

  useEffect(() => {
    // Initialize PeerJS with random ID for viewer
    const viewerId = `viewer_${Math.random().toString(36).substr(2, 9)}`
    const peer = new Peer(viewerId, {
      host: location.hostname,
      port: location.port || (location.protocol === 'https:' ? 443 : 3001),
      path: '/peerjs',
      debug: 2
    })

    peerRef.current = peer

    return () => {
      if (peerRef.current) {
        peerRef.current.destroy()
      }
      if (connectionRef.current) {
        connectionRef.current.close()
      }
    }
  }, [])

  const connectToStream = async () => {
    if (!streamId.trim()) {
      alert('Bitte geben Sie eine Stream-ID ein')
      return
    }

    setIsLoading(true)
    
    try {
      const peer = peerRef.current!
      
      // Call the broadcaster
      const call = peer.call(streamId, undefined)
      
      call.on('stream', (remoteStream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream
          videoRef.current.play()
          setIsConnected(true)
          setIsLoading(false)
        }
      })

      call.on('error', (error) => {
        console.error('Call error:', error)
        alert('Fehler beim Verbinden mit dem Stream')
        setIsLoading(false)
      })

      connectionRef.current = call

    } catch (error) {
      console.error('Error connecting:', error)
      alert('Fehler beim Verbinden')
      setIsLoading(false)
    }
  }

  const disconnectFromStream = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (connectionRef.current) {
      connectionRef.current.close()
    }
    setIsConnected(false)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">👁️ Stream Watch</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Stream beitreten</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stream-ID eingeben
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={streamId}
                    onChange={(e) => setStreamId(e.target.value)}
                    placeholder="z.B. stream_abc123def"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isConnected || isLoading}
                  />
                  {!isConnected ? (
                    <button
                      onClick={connectToStream}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 px-6 py-2 rounded-r-lg font-medium"
                    >
                      {isLoading ? 'Verbinde...' : 'Verbinden'}
                    </button>
                  ) : (
                    <button
                      onClick={disconnectFromStream}
                      className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-r-lg font-medium"
                    >
                      Trennen
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-400">
                  Geben Sie die Stream-ID ein, die Sie vom Broadcaster erhalten haben
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-lg font-bold mb-3">Anleitung</h3>
            <ol className="list-decimal pl-5 space-y-2 text-gray-300">
              <li>Holen Sie sich die Stream-ID vom Broadcaster</li>
              <li>Geben Sie die ID in das Feld oben ein</li>
              <li>Klicken Sie auf "Verbinden"</li>
              <li>Genießen Sie den Live-Stream</li>
            </ol>
          </div>

          {isConnected && (
            <div className="bg-green-900/20 border border-green-800 p-4 rounded-xl">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse mr-3"></div>
                <span className="font-medium">Erfolgreich verbunden!</span>
              </div>
              <p className="text-sm text-green-300 mt-2">
                Sie sehen jetzt den Live-Stream. Die Qualität hängt von Ihrer Internetverbindung ab.
              </p>
            </div>
          )}
        </div>

        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
          <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Stream</h3>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span>{isConnected ? 'Live' : 'Getrennt'}</span>
              </div>
            </div>
          </div>
          <div className="aspect-video bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              controls
            />
            {!isConnected && !isLoading && (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4">📺</div>
                  <p>Kein Stream verbunden</p>
                  <p className="text-sm mt-2">Geben Sie eine Stream-ID ein, um zu verbinden</p>
                </div>
              </div>
            )}
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>Verbinde mit Stream...</p>
                </div>
              </div>
            )}
          </div>
          <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Status: {isConnected ? 'Verbunden' : 'Getrennt'}</span>
              <span>Peer-to-Peer Streaming</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

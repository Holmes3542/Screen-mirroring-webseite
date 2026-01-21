import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center py-16">
        <h1 className="text-5xl font-bold mb-6">
          Willkommen bei der Streaming App
        </h1>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Streamen Sie Ihren eigenen Inhalt oder schauen Sie sich Streams an - alles in einer Web-App
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">🎥 Streamen</h2>
            <p className="text-gray-300 mb-6">
              Starten Sie Ihren eigenen Stream. Teilen Sie Ihren Bildschirm oder verwenden Sie Ihre Webcam.
            </p>
            <Link
              href="/broadcast"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Jetzt streamen
            </Link>
          </div>
          
          <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-4">👁️ Zuschauen</h2>
            <p className="text-gray-300 mb-6">
              Schauen Sie sich Live-Streams an. Geben Sie eine Stream-ID ein, um zu verbinden.
            </p>
            <Link
              href="/watch"
              className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Streams ansehen
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-white">
              StreamApp
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/broadcast"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Streamen
            </Link>
            <Link
              href="/watch"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md text-sm font-medium transition"
            >
              Zuschauen
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

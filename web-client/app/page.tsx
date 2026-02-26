'use client'

import dynamic from 'next/dynamic'

// Disable SSR for App component because it uses browser-only APIs (Agora SDK)
const App = dynamic(() => import('@/components/App'), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-white text-lg">Loading...</div>
        </div>
    ),
})

export default function HomePage() {
    return <App />
}

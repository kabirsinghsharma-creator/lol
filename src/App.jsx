import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import OceanBackground from './components/OceanBackground.jsx'
import Setup from './components/Setup.jsx'
import GameScreen from './components/GameScreen.jsx'
import { sfx } from './audio/sfx.js'

export default function App() {
  const [config, setConfig] = useState(null)
  const [gameKey, setGameKey] = useState(0)
  const [muted, setMuted] = useState(sfx.muted)

  // Browsers only allow audio after a user gesture.
  useEffect(() => {
    const unlock = () => sfx.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  const toggleMute = () => {
    sfx.setMuted(!muted)
    setMuted(!muted)
  }

  return (
    <div className="relative h-full overflow-hidden">
      <OceanBackground />
      {config ? (
        <GameScreen key={gameKey} config={config} onExit={() => setConfig(null)} muted={muted} onToggleMute={toggleMute} />
      ) : (
        <>
          <button
            onClick={toggleMute}
            className="fixed top-3 right-3 z-30 p-2 rounded-xl bg-white/5 hover:bg-white/10"
            aria-label={muted ? 'Unmute' : 'Mute'}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <Setup
            onStart={(c) => {
              sfx.unlock()
              sfx.click()
              setGameKey((k) => k + 1)
              setConfig(c)
            }}
          />
        </>
      )}
    </div>
  )
}

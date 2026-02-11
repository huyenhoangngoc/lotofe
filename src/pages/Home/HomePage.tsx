import { useState } from 'react'

export function HomePage() {
  const [roomCode, setRoomCode] = useState('')

  const handleJoin = () => {
    if (roomCode.length === 6) {
      window.location.href = `/play/${roomCode}`
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="text-center mb-12">
        <h1
          className="text-5xl md:text-7xl font-bold mb-4"
          style={{
            fontFamily: "'Playfair Display', serif",
            color: 'var(--color-title)',
          }}
        >
          Lô Tô Online
        </h1>
        <p className="text-lg md:text-xl" style={{ color: 'var(--color-text-light)' }}>
          Tro choi lo to truyen thong Viet Nam
        </p>
      </div>

      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: 'var(--color-text)' }}>
          Tham gia phong choi
        </h2>

        <div className="mb-4">
          <input
            type="text"
            maxLength={6}
            placeholder="Nhap ma phong (6 so)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 text-center text-2xl tracking-[0.3em] rounded-xl outline-none transition-colors"
            style={{
              fontFamily: "'Courier Prime', monospace",
              fontWeight: 700,
              backgroundColor: 'var(--color-bg)',
              border: '2px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={roomCode.length !== 6}
          className="w-full py-4 text-lg font-bold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: roomCode.length === 6 ? 'var(--color-primary-500)' : 'var(--color-text-muted)',
          }}
        >
          Vao phong
        </button>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl w-full">
        {[
          { title: 'Tao phong', desc: 'Dang nhap va tao phong choi cua ban' },
          { title: 'Moi ban be', desc: 'Chia se ma phong 6 so de moi ban' },
          { title: 'Choi ngay', desc: 'Boc so, dong dau, bam KINH de thang!' },
        ].map((item) => (
          <div
            key={item.title}
            className="p-6 rounded-xl text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-primary-500)' }}>
              {item.title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

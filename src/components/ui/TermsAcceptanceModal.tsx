import { useState } from 'react'
import { DISCLAIMER_SHORT, TERMS_SECTIONS, PRIVACY_SECTIONS } from '../../content/legalContent'

interface TermsAcceptanceModalProps {
  isOpen: boolean
  onAccept: () => void
  onDecline: () => void
  loading: boolean
}

export function TermsAcceptanceModal({ isOpen, onAccept, onDecline, loading }: TermsAcceptanceModalProps) {
  const [agreed, setAgreed] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/50">
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4"
          style={{ backgroundColor: 'var(--color-primary-500)' }}
        >
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-primary-text)' }}>
            Điều khoản sử dụng
          </h2>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Disclaimer */}
          <div
            className="p-3 rounded-lg text-sm font-medium text-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
              color: 'var(--color-text)',
              border: '1px solid var(--color-warning)',
            }}
          >
            {DISCLAIMER_SHORT}
          </div>

          {/* Scrollable summary */}
          <div
            className="max-h-60 overflow-y-auto rounded-lg p-4 space-y-3 text-sm"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-light)',
            }}
          >
            <p className="font-semibold" style={{ color: 'var(--color-text)' }}>
              Tóm tắt Điều khoản:
            </p>
            {TERMS_SECTIONS.slice(0, 4).map((s, i) => (
              <div key={i}>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{s.title}</p>
                <p className="mt-1">{s.content}</p>
              </div>
            ))}
            <p className="font-semibold mt-2" style={{ color: 'var(--color-text)' }}>
              Tóm tắt Chính sách bảo mật:
            </p>
            {PRIVACY_SECTIONS.slice(0, 3).map((s, i) => (
              <div key={i}>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>{s.title}</p>
                <p className="mt-1">{s.content}</p>
              </div>
            ))}
          </div>

          {/* Links */}
          <div className="flex gap-4 justify-center text-sm">
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--color-primary-500)' }}
            >
              Xem đầy đủ Điều khoản
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
              style={{ color: 'var(--color-primary-500)' }}
            >
              Xem Chính sách bảo mật
            </a>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 accent-current"
              style={{ accentColor: 'var(--color-primary-500)' }}
            />
            <span className="text-sm" style={{ color: 'var(--color-text)' }}>
              Tôi đã đọc và đồng ý với{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--color-primary-500)' }}>
                Điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--color-primary-500)' }}>
                Chính sách bảo mật
              </a>
            </span>
          </label>
        </div>

        {/* Actions */}
        <div
          className="px-6 py-4 flex gap-3"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <button
            onClick={onDecline}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg font-medium text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
            }}
          >
            Từ chối
          </button>
          <button
            onClick={onAccept}
            disabled={!agreed || loading}
            className="flex-1 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--color-primary-500)', color: 'var(--color-primary-text)' }}
          >
            {loading ? 'Đang xử lý...' : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useNavigate } from 'react-router'
import { PRIVACY_SECTIONS } from '../content/legalContent'
import { ThemeToggle } from '../components/ui/ThemeToggle'

export function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 text-sm font-medium hover:underline"
          style={{ color: 'var(--color-primary-500)' }}
        >
          &larr; Quay lại
        </button>

        <h1
          className="text-3xl font-bold mb-8"
          style={{ color: 'var(--color-text)' }}
        >
          Chính sách bảo mật
        </h1>

        <div className="space-y-6">
          {PRIVACY_SECTIONS.map((section, idx) => (
            <div
              key={idx}
              className="rounded-xl p-5"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--color-text)' }}
              >
                {section.title}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-text-light)' }}
              >
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <p
          className="mt-8 text-center text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Phiên bản: 1.0 &mdash; Cập nhật lần cuối: Tháng 2, 2025
        </p>
      </div>
    </div>
  )
}

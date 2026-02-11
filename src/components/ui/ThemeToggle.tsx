import { useThemeStore } from '../../stores/themeStore'

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const toggle = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('tet')
    else setTheme('light')
  }

  const label = theme === 'light' ? 'Sáng' : theme === 'dark' ? 'Tối' : 'Tết'
  const icon = theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🧧'

  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
      style={{
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-light)',
      }}
      title={`Theme: ${label}`}
    >
      {icon} {label}
    </button>
  )
}

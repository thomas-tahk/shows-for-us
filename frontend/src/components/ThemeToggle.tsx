import { useState } from 'react'

type Theme = 'light' | 'dark'

const currentTheme = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(currentTheme)
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  const switchTheme = () => {
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // storage blocked: the choice still applies for this visit
    }
    setTheme(next)
  }
  return (
    <button
      type="button"
      onClick={switchTheme}
      className="ml-auto inline-flex min-h-11 items-center rounded-lg border border-neutral-600 px-3 text-sm font-semibold text-neutral-200 hover:border-amber-400 focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {next === 'light' ? 'Light mode' : 'Dark mode'}
    </button>
  )
}

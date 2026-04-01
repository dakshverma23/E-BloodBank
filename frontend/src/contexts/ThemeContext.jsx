import { createContext, useContext } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const theme = {
    // Dark mode is disabled; keep API surface for callers.
    isDarkMode: false,
    toggleTheme: () => {},
    colors: {
      primary: '#ff7a18',
      primaryHover: '#ff9c4d',
      background: 'rgba(7, 6, 11, 0.88)',
      surface: 'linear-gradient(180deg, rgba(18,16,34,.90) 0%, rgba(18,16,34,.78) 100%)',
      surfaceElevated: 'rgba(20,18,38,.95)',
      text: '#f7f7fb',
      textSecondary: 'rgba(247,247,251,.84)',
      border: 'rgba(255,255,255,.20)',
      shadow: 'rgba(0, 0, 0, 0.45)',
      gradient: 'linear-gradient(135deg, rgba(124,58,237,.18) 0%, rgba(255,46,73,.14) 100%)',
      gradientButton: 'linear-gradient(135deg, #ff2e49 0%, #ff7a18 100%)',
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}


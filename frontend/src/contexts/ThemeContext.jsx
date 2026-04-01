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
      primary: '#667eea',
      primaryHover: '#764ba2',
      background: '#ffffff',
      surface: '#ffffff',
      surfaceElevated: '#ffffff',
      text: '#262626',
      textSecondary: '#8c8c8c',
      border: '#d9d9d9',
      shadow: 'rgba(0, 0, 0, 0.1)',
      gradient: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
      gradientButton: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}


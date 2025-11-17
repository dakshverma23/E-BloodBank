import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true
    }
    return false
  })

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
    
    // Apply theme class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      primary: isDarkMode ? '#818cf8' : '#667eea',
      primaryHover: isDarkMode ? '#a5b4fc' : '#764ba2',
      background: isDarkMode ? '#0f172a' : '#ffffff',
      surface: isDarkMode ? '#1e293b' : '#ffffff',
      surfaceElevated: isDarkMode ? '#334155' : '#ffffff',
      text: isDarkMode ? '#f1f5f9' : '#262626',
      textSecondary: isDarkMode ? '#cbd5e1' : '#8c8c8c',
      border: isDarkMode ? '#334155' : '#d9d9d9',
      shadow: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
      gradient: isDarkMode 
        ? 'linear-gradient(135deg, #818cf815 0%, #a5b4fc15 100%)' 
        : 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
      gradientButton: isDarkMode 
        ? 'linear-gradient(135deg, #818cf8 0%, #a5b4fc 100%)' 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  )
}


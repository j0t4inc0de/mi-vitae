import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const RouterContext = createContext(null)

/**
 * Normalizes URL path handling both standard pathname and hash routing:
 * - "/carlos_dev" -> "/carlos_dev"
 * - "/#/carlos_dev" -> "/carlos_dev"
 * - "" -> "/"
 */
export function getNormalizedPath() {
  const hash = window.location.hash
  if (hash && hash.startsWith('#/')) {
    return hash.slice(1) // returns "/carlos_dev", "/dashboard", etc.
  }
  const pathname = window.location.pathname
  return pathname || '/'
}

/**
 * Resolves current route and extract route parameters
 */
export function matchRoute(path) {
  const cleanPath = path.split('?')[0].split('#')[0]
  const segments = cleanPath.split('/').filter(Boolean)

  if (segments.length === 0) {
    return { name: 'landing', path: '/', params: {} }
  }

  const firstSegment = segments[0].toLowerCase()

  if (firstSegment === 'dashboard') {
    return { name: 'dashboard', path: '/dashboard', params: {} }
  }

  if (firstSegment === 'admin') {
    return { name: 'admin', path: '/admin', params: {} }
  }

  if (firstSegment === 'auth' || firstSegment === 'login' || firstSegment === 'register' || firstSegment === 'signin') {
    return { 
      name: 'auth', 
      path: `/${firstSegment}`, 
      params: { initialMode: firstSegment === 'register' ? 'register' : 'login' } 
    }
  }

  // If path contains multiple unhandled segments, treat as not found
  if (segments.length > 1) {
    return { name: 'not_found', path: cleanPath, params: {} }
  }

  let decodedUsername = segments[0]
  try {
    decodedUsername = decodeURIComponent(segments[0])
  } catch {
    // Malformed URI sequence, fallback to raw segment
  }

  // Dynamic portfolio route: /:username
  return {
    name: 'portfolio',
    path: `/${segments[0]}`,
    params: { username: decodedUsername }
  }
}

/**
 * Router Provider Component
 */
export function Router({ children }) {
  const [currentPath, setCurrentPath] = useState(getNormalizedPath)

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(getNormalizedPath())
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  const navigate = useCallback((to) => {
    if (!to) return

    let targetPath = to
    // Ensure leading slash
    if (!targetPath.startsWith('/') && !targetPath.startsWith('#')) {
      targetPath = '/' + targetPath
    }

    // Update browser history
    if (window.location.hash.startsWith('#/')) {
      window.location.hash = '#' + targetPath
    } else {
      window.history.pushState({}, '', targetPath)
      setCurrentPath(targetPath)
    }

    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const routeInfo = useMemo(() => {
    const matched = matchRoute(currentPath)
    return {
      currentPath,
      route: matched.name,
      params: matched.params,
      navigate
    }
  }, [currentPath, navigate])

  return (
    <RouterContext.Provider value={routeInfo}>
      {children}
    </RouterContext.Provider>
  )
}

/**
 * Hook to access router context
 */
export function useRouter() {
  const context = useContext(RouterContext)
  if (!context) {
    throw new Error('useRouter must be used within a Router')
  }
  return context
}

/**
 * Hook to access route params
 */
export function useParams() {
  const { params } = useRouter()
  return params
}

/**
 * Hook to access navigate function
 */
export function useNavigate() {
  const { navigate } = useRouter()
  return navigate
}

/**
 * SPA Link Component
 */
export function Link({ to, children, className = '', onClick, activeClassName = '', ...props }) {
  const { currentPath, navigate } = useRouter()
  
  let targetPath = to || '/'
  if (!targetPath.startsWith('/') && !targetPath.startsWith('#')) {
    targetPath = '/' + targetPath
  }

  const isActive = currentPath === targetPath

  const handleClick = (e) => {
    // Let browser handle external links or modifier clicks
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || props.target === '_blank') {
      return
    }

    if (targetPath.startsWith('http://') || targetPath.startsWith('https://') || targetPath.startsWith('mailto:') || targetPath.startsWith('tel:')) {
      return
    }

    e.preventDefault()
    if (onClick) onClick(e)
    navigate(targetPath)
  }

  const combinedClasses = `${className} ${isActive ? activeClassName : ''}`.trim()

  return (
    <a href={targetPath} onClick={handleClick} className={combinedClasses} {...props}>
      {children}
    </a>
  )
}

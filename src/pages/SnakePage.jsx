import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Trophy, Play, Pause, RotateCcw, ArrowLeft, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'

// ponytail: Game constants - 20x20 grid, 20px cell = 400x400 native resolution
const GRID_SIZE = 20
const CELL_SIZE = 20
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE // 400px
const HIGH_SCORE_KEY = 'mivitae_snake_highscore'

// ponytail: Base tick interval (80ms = snappy responsive arcade movement)
const BASE_TICK_INTERVAL = 80

/**
 * Native rounded rectangle drawer with backward compatibility
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.fill()
  }
}

/**
 * Safely retrieve highscore from localStorage
 */
function getStoredHighScore() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY)
      return saved ? parseInt(saved, 10) || 0 : 0
    }
  } catch {
    // Ignore storage access errors
  }
  return 0
}

/**
 * Safely store highscore to localStorage
 */
function saveHighScoreToStorage(score) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HIGH_SCORE_KEY, String(score))
    }
  } catch {
    // Ignore storage write errors
  }
}

/**
 * Dedicated Snake Game Page (Window / Tab View)
 * Features 60 FPS interpolated rendering for liquid-smooth motion without 15fps stutter.
 * Zero emojis - pure minimalist retro aesthetic.
 */
export default function SnakePage() {
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(getStoredHighScore)
  const [isStarted, setIsStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [isNewRecord, setIsNewRecord] = useState(false)

  const canvasRef = useRef(null)

  // Mutable game state refs for high-performance 60fps canvas loop without stale closures
  const snakeRef = useRef([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ])
  const prevSnakeRef = useRef([
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 }
  ])
  const dirRef = useRef({ x: 1, y: 0 })
  const nextDirRef = useRef({ x: 1, y: 0 })
  const foodRef = useRef({ x: 15, y: 10 })
  const isStartedRef = useRef(false)
  const isPausedRef = useRef(false)
  const gameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const highScoreRef = useRef(highScore)
  const lastTickTimeRef = useRef(0)
  const tickIntervalRef = useRef(BASE_TICK_INTERVAL)

  useEffect(() => {
    highScoreRef.current = highScore
  }, [highScore])

  /**
   * Spawns a food item in a cell not occupied by the snake
   */
  const spawnFood = useCallback((currentSnake) => {
    let newX, newY, collision
    let attempts = 0
    do {
      newX = Math.floor(Math.random() * GRID_SIZE)
      newY = Math.floor(Math.random() * GRID_SIZE)
      collision = currentSnake.some(seg => seg.x === newX && seg.y === newY)
      attempts++
    } while (collision && attempts < 200)

    foodRef.current = { x: newX, y: newY }
  }, [])

  /**
   * Resets the snake game to clean ready state
   */
  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ]
    snakeRef.current = initialSnake
    prevSnakeRef.current = initialSnake.map(s => ({ ...s }))
    dirRef.current = { x: 1, y: 0 }
    nextDirRef.current = { x: 1, y: 0 }
    scoreRef.current = 0
    gameOverRef.current = false
    isPausedRef.current = false
    isStartedRef.current = false
    lastTickTimeRef.current = performance.now()
    tickIntervalRef.current = BASE_TICK_INTERVAL

    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setIsStarted(false)
    setIsNewRecord(false)

    spawnFood(initialSnake)
  }, [spawnFood])

  /**
   * Starts or resumes snake movement
   */
  const startGame = useCallback((initialDir) => {
    if (gameOverRef.current) {
      resetGame()
    }
    if (initialDir) {
      dirRef.current = initialDir
      nextDirRef.current = initialDir
    }
    gameOverRef.current = false
    isPausedRef.current = false
    isStartedRef.current = true
    lastTickTimeRef.current = performance.now()

    setGameOver(false)
    setIsPaused(false)
    setIsStarted(true)
  }, [resetGame])

  /**
   * Direction updater avoiding instant 180-degree reversals
   */
  const handleDirectionChange = useCallback((newDir) => {
    if (gameOverRef.current) {
      startGame(newDir)
      return
    }
    if (isPausedRef.current) return
    if (!isStartedRef.current) {
      startGame(newDir)
      return
    }
    const cur = dirRef.current
    if (newDir.x !== 0 && cur.x !== 0) return
    if (newDir.y !== 0 && cur.y !== 0) return
    nextDirRef.current = newDir
  }, [startGame])

  /**
   * Keyboard controls listener
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent page scroll when interacting with snake game
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key) || e.code === 'Space') {
        e.preventDefault()
      }

      if (e.key === 'Escape') {
        if (window.history.length > 1) {
          window.history.back()
        } else {
          window.location.href = '/'
        }
        return
      }

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
        if (gameOverRef.current) {
          resetGame()
        } else if (!isStartedRef.current) {
          startGame()
        } else {
          isPausedRef.current = !isPausedRef.current
          setIsPaused(isPausedRef.current)
        }
        return
      }

      const k = e.key
      if (k === 'ArrowUp' || k === 'KeyW' || k === 'w' || k === 'W') {
        handleDirectionChange({ x: 0, y: -1 })
      } else if (k === 'ArrowDown' || k === 'KeyS' || k === 's' || k === 'S') {
        handleDirectionChange({ x: 0, y: 1 })
      } else if (k === 'ArrowLeft' || k === 'KeyA' || k === 'a' || k === 'A') {
        handleDirectionChange({ x: -1, y: 0 })
      } else if (k === 'ArrowRight' || k === 'KeyD' || k === 'd' || k === 'D') {
        handleDirectionChange({ x: 1, y: 0 })
      }
    }

    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [resetGame, startGame, handleDirectionChange])

  /**
   * Game step logic (tick)
   */
  const tick = useCallback(() => {
    if (!isStartedRef.current || gameOverRef.current || isPausedRef.current) return

    const curSnake = snakeRef.current
    const dir = nextDirRef.current
    dirRef.current = dir

    const head = curSnake[0]
    const newHead = { x: head.x + dir.x, y: head.y + dir.y }

    // Save previous positions for smooth 60fps interpolation
    prevSnakeRef.current = curSnake.map(seg => ({ ...seg }))

    // Wall collision check
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      gameOverRef.current = true
      isStartedRef.current = false
      setGameOver(true)
      setIsStarted(false)
      return
    }

    // Self collision check
    if (curSnake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
      gameOverRef.current = true
      isStartedRef.current = false
      setGameOver(true)
      setIsStarted(false)
      return
    }

    // Food collision check
    const food = foodRef.current
    if (newHead.x === food.x && newHead.y === food.y) {
      const newScore = scoreRef.current + 10
      scoreRef.current = newScore
      setScore(newScore)

      // Dynamic subtle speed progression (80ms down to 60ms minimum)
      tickIntervalRef.current = Math.max(60, BASE_TICK_INTERVAL - Math.floor(newScore / 40) * 3)

      if (newScore > highScoreRef.current) {
        highScoreRef.current = newScore
        setHighScore(newScore)
        setIsNewRecord(true)
        saveHighScoreToStorage(newScore)
      }

      const updatedSnake = [newHead, ...curSnake]
      snakeRef.current = updatedSnake
      spawnFood(updatedSnake)
    } else {
      snakeRef.current = [newHead, ...curSnake.slice(0, -1)]
    }
  }, [spawnFood])

  /**
   * Render canvas frame with smooth interpolation (progress 0..1)
   */
  const render = useCallback((progress = 1) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Background
    ctx.fillStyle = '#090d16'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Subtle grid dots
    ctx.fillStyle = '#172033'
    for (let x = CELL_SIZE; x < CANVAS_SIZE; x += CELL_SIZE) {
      for (let y = CELL_SIZE; y < CANVAS_SIZE; y += CELL_SIZE) {
        ctx.fillRect(x - 0.5, y - 0.5, 1, 1)
      }
    }

    // 2. Food (clean glowing amber badge - no emojis)
    const food = foodRef.current
    const cx = food.x * CELL_SIZE + CELL_SIZE / 2
    const cy = food.y * CELL_SIZE + CELL_SIZE / 2

    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14)
    glow.addColorStop(0, 'rgba(251, 191, 36, 0.85)')
    glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)')
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(cx, cy, 14, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#f59e0b'
    drawRoundedRect(ctx, cx - 6.5, cy - 6.5, 13, 13, 3.5)

    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(cx, cy, 2.2, 0, Math.PI * 2)
    ctx.fill()

    // 3. Snake with smooth 60 FPS interpolation
    const curSnake = snakeRef.current
    const prevSnake = prevSnakeRef.current
    const dir = dirRef.current
    const p = Math.min(1, Math.max(0, progress))

    // Body segments
    for (let i = curSnake.length - 1; i > 0; i--) {
      const seg = curSnake[i]
      const prev = prevSnake[i] || seg

      // Sub-pixel linear interpolation between previous and current cell
      const interpX = prev.x + (seg.x - prev.x) * p
      const interpY = prev.y + (seg.y - prev.y) * p

      const sx = interpX * CELL_SIZE
      const sy = interpY * CELL_SIZE
      const pad = 1.5
      const size = CELL_SIZE - pad * 2
      const ratio = i / Math.max(curSnake.length, 1)

      ctx.fillStyle = ratio > 0.5 ? '#3730a3' : '#4338ca'
      drawRoundedRect(ctx, sx + pad, sy + pad, size, size, 4)
    }

    // Head
    if (curSnake.length > 0) {
      const head = curSnake[0]
      const prevHead = prevSnake[0] || head

      const interpHeadX = prevHead.x + (head.x - prevHead.x) * p
      const interpHeadY = prevHead.y + (head.y - prevHead.y) * p

      const hx = interpHeadX * CELL_SIZE
      const hy = interpHeadY * CELL_SIZE
      const pad = 1
      const size = CELL_SIZE - pad * 2

      const grad = ctx.createLinearGradient(hx, hy, hx + size, hy + size)
      grad.addColorStop(0, '#6366f1')
      grad.addColorStop(1, '#4338ca')
      ctx.fillStyle = grad
      drawRoundedRect(ctx, hx + pad, hy + pad, size, size, 5)

      // Expressive eyes pointing towards movement direction
      let eye1 = { x: hx + 5.5, y: hy + 6.5 }
      let eye2 = { x: hx + 14.5, y: hy + 6.5 }
      let pupilOffset = { x: 0, y: -0.8 }

      if (dir.x === 1) { // Right
        eye1 = { x: hx + 13.5, y: hy + 5.5 }
        eye2 = { x: hx + 13.5, y: hy + 14.5 }
        pupilOffset = { x: 1, y: 0 }
      } else if (dir.x === -1) { // Left
        eye1 = { x: hx + 6.5, y: hy + 5.5 }
        eye2 = { x: hx + 6.5, y: hy + 14.5 }
        pupilOffset = { x: -1, y: 0 }
      } else if (dir.y === 1) { // Down
        eye1 = { x: hx + 5.5, y: hy + 13.5 }
        eye2 = { x: hx + 14.5, y: hy + 13.5 }
        pupilOffset = { x: 0, y: 1 }
      }

      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(eye1.x, eye1.y, 2.4, 0, Math.PI * 2)
      ctx.arc(eye2.x, eye2.y, 2.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(eye1.x + pupilOffset.x, eye1.y + pupilOffset.y, 1.2, 0, Math.PI * 2)
      ctx.arc(eye2.x + pupilOffset.x, eye2.y + pupilOffset.y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // 4. Overlays (NO EMOJIS - clean typographic layout)
    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(9, 13, 22, 0.88)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#f43f5e'
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillText('JUEGO TERMINADO', CANVAS_SIZE / 2, 160)

      ctx.fillStyle = '#f8fafc'
      ctx.font = '600 16px system-ui, -apple-system, sans-serif'
      ctx.fillText(`Puntuacion final: ${scoreRef.current}`, CANVAS_SIZE / 2, 195)

      if (scoreRef.current >= highScoreRef.current && scoreRef.current > 0) {
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
        ctx.fillText('NUEVO RECORD', CANVAS_SIZE / 2, 225)
      } else {
        ctx.fillStyle = '#94a3b8'
        ctx.font = '14px system-ui, -apple-system, sans-serif'
        ctx.fillText(`Record maximo: ${highScoreRef.current}`, CANVAS_SIZE / 2, 225)
      }

      ctx.fillStyle = '#818cf8'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.fillText('Pulsa Espacio o cualquier tecla para jugar', CANVAS_SIZE / 2, 265)
    } else if (isPausedRef.current) {
      ctx.fillStyle = 'rgba(9, 13, 22, 0.80)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillText('PAUSA', CANVAS_SIZE / 2, 190)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '14px system-ui, -apple-system, sans-serif'
      ctx.fillText('Pulsa Espacio para reanudar', CANVAS_SIZE / 2, 225)
    } else if (!isStartedRef.current) {
      ctx.fillStyle = 'rgba(9, 13, 22, 0.65)'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      ctx.textAlign = 'center'
      ctx.fillStyle = '#818cf8'
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
      ctx.fillText('Presiona para jugar', CANVAS_SIZE / 2, 185)

      ctx.fillStyle = '#94a3b8'
      ctx.font = '13px system-ui, -apple-system, sans-serif'
      ctx.fillText('Usa las flechas, WASD o Espacio', CANVAS_SIZE / 2, 215)
    }
  }, [])

  /**
   * 60 FPS RequestAnimationFrame game loop with sub-frame interpolation
   */
  useEffect(() => {
    let animId
    lastTickTimeRef.current = performance.now()

    const loop = (now) => {
      if (!isStartedRef.current || isPausedRef.current || gameOverRef.current) {
        lastTickTimeRef.current = now
        render(1)
      } else {
        const interval = tickIntervalRef.current
        const elapsed = now - lastTickTimeRef.current
        if (elapsed >= interval) {
          lastTickTimeRef.current = now
          tick()
          render(0)
        } else {
          const progress = Math.min(1, Math.max(0, elapsed / interval))
          render(progress)
        }
      }
      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      if (animId) cancelAnimationFrame(animId)
    }
  }, [tick, render])

  const handleReturn = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col justify-between py-6 px-4 sm:px-8">
      {/* Top Header Navigation */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between">
        <button
          type="button"
          onClick={handleReturn}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Mi Vitae</span>
        </button>

        <a
          href="/"
          className="text-xs font-bold text-slate-500 hover:text-slate-300 font-mono tracking-tight"
        >
          mivitae.wearesamod.com
        </a>
      </div>

      {/* Main Game Container */}
      <div className="max-w-xl w-full mx-auto my-auto space-y-4 py-4">
        {/* Scoreboard */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Puntos:</span>
            <span className="font-black text-indigo-400 text-base">{score}</span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-400 font-normal">Record:</span>
            <span className="font-bold text-amber-300 text-base">{highScore}</span>
            {isNewRecord && (
              <span className="ml-1 text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Nuevo Record
              </span>
            )}
          </div>
        </div>

        {/* Native HTML5 Canvas */}
        <div className="relative flex justify-center items-center">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="w-full max-w-[340px] sm:max-w-[400px] aspect-square rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl block mx-auto touch-none"
          />
        </div>

        {/* Mobile Touch D-Pad */}
        <div className="sm:hidden pt-2 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => handleDirectionChange({ x: 0, y: -1 })}
            aria-label="Arriba"
            className="w-14 h-11 rounded-xl bg-slate-800 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white border border-slate-700 shadow-sm cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleDirectionChange({ x: -1, y: 0 })}
              aria-label="Izquierda"
              className="w-14 h-11 rounded-xl bg-slate-800 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white border border-slate-700 shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange({ x: 0, y: 1 })}
              aria-label="Abajo"
              className="w-14 h-11 rounded-xl bg-slate-800 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white border border-slate-700 shadow-sm cursor-pointer"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange({ x: 1, y: 0 })}
              aria-label="Derecha"
              className="w-14 h-11 rounded-xl bg-slate-800 active:bg-indigo-600 flex items-center justify-center text-slate-200 active:text-white border border-slate-700 shadow-sm cursor-pointer"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons & Hints */}
        <div className="space-y-3 pt-1">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {gameOver ? (
              <button
                type="button"
                onClick={() => startGame()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar de nuevo (Espacio)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (!isStarted) {
                    startGame()
                  } else {
                    isPausedRef.current = !isPausedRef.current
                    setIsPaused(isPausedRef.current)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                {!isStarted ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Empezar a jugar</span>
                  </>
                ) : isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Reanudar</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pausar</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer active:scale-95"
            >
              Volver a Mi Vitae
            </button>
          </div>

          <p className="text-[11px] text-center text-slate-400 font-mono hidden sm:block">
            Controles: Flechas o WASD | Espacio: Iniciar/Pausa | Esc: Volver
          </p>
        </div>
      </div>
    </div>
  )
}

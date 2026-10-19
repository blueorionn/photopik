import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ASPECT_RATIOS, IMAGE_MODELS, demoImage, dimensionsFor } from './models'

interface HistoryItem {
  id: number
  src: string
  prompt: string
  model: string
  seed: number
  width: number
  height: number
  format: string
  at: string
}

const SETTINGS_KEY = 'photopik-settings'
const KEY_STORAGE = 'photopik-openrouter-key'

function randomSeed() {
  return Math.floor(Math.random() * 999_999_999)
}

function loadSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Record<string, unknown>
  } catch { return {} }
}

export default function App() {
  const [saved] = useState(loadSettings)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '')
  const [rememberKey, setRememberKey] = useState(() => Boolean(localStorage.getItem(KEY_STORAGE)))
  const [showKey, setShowKey] = useState(false)
  const [keyError, setKeyError] = useState('')
  const [modelId, setModelId] = useState(() =>
    typeof saved.modelId === 'string' ? saved.modelId : IMAGE_MODELS[0].id)
  const [prompt, setPrompt] = useState(() => (typeof saved.prompt === 'string' ? saved.prompt : ''))
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspect, setAspect] = useState<string>(() =>
    typeof saved.aspect === 'string' ? saved.aspect : '1:1')
  const [resolution, setResolution] = useState(() =>
    typeof saved.resolution === 'string' ? saved.resolution : '1K')
  const [customSize, setCustomSize] = useState(false)
  const [width, setWidth] = useState(1024)
  const [height, setHeight] = useState(1024)
  const [seed, setSeed] = useState(randomSeed)
  const [randomSeedOn, setRandomSeedOn] = useState(true)
  const [count, setCount] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [format, setFormat] = useState('png')
  const [promptError, setPromptError] = useState('')
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle')
  const [current, setCurrent] = useState<HistoryItem | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  const model = useMemo(
    () => IMAGE_MODELS.find((m) => m.id === modelId) ?? IMAGE_MODELS[0],
    [modelId],
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('photopik-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ prompt, modelId, aspect, resolution }))
  }, [prompt, modelId, aspect, resolution])

  function changeModel(id: string) {
    const next = IMAGE_MODELS.find((m) => m.id === id) ?? IMAGE_MODELS[0]
    setModelId(id)
    if (!next.resolutions.includes(resolution)) {
      setResolution(next.resolutions[0])
      if (!customSize) {
        const d = dimensionsFor(aspect, next.resolutions[0])
        setWidth(d.width); setHeight(d.height)
      }
    }
    if (count > next.maxImages) setCount(next.maxImages)
    if (!next.formats.includes(format)) setFormat(next.formats[0])
  }

  function changeAspect(value: string) {
    setAspect(value)
    setCustomSize(false)
    const d = dimensionsFor(value, resolution)
    setWidth(d.width); setHeight(d.height)
  }

  function changeResolution(value: string) {
    setResolution(value)
    setCustomSize(false)
    const d = dimensionsFor(aspect, value)
    setWidth(d.width); setHeight(d.height)
  }

  const connected = apiKey.trim().startsWith('sk-or-')

  function saveKey() {
    const value = apiKey.trim()
    if (value && !value.startsWith('sk-or-')) {
      setKeyError('OpenRouter keys start with sk-or-. Check the key and try again.')
      return
    }
    setKeyError('')
    if (rememberKey && value) localStorage.setItem(KEY_STORAGE, value)
    else localStorage.removeItem(KEY_STORAGE)
  }

  function generate() {
    if (!prompt.trim()) {
      setPromptError('Prompt is required. Describe the image you want.')
      return
    }
    setPromptError('')
    const usedSeed = randomSeedOn ? randomSeed() : seed
    if (randomSeedOn) setSeed(usedSeed)
    setStatus('generating')
    window.setTimeout(() => {
      const item: HistoryItem = {
        id: Date.now(),
        src: demoImage(prompt, usedSeed, width, height),
        prompt: prompt.trim(),
        model: model.id,
        seed: usedSeed,
        width,
        height,
        format,
        at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setCurrent(item)
      setHistory((h) => [item, ...h].slice(0, 12))
      setStatus('done')
    }, 900)
  }

  function resetAll() {
    setPrompt('')
    setNegativePrompt('')
    setAspect('1:1')
    setResolution('1K')
    setCustomSize(false)
    setWidth(1024); setHeight(1024)
    setSeed(randomSeed())
    setCount(1)
    setQuality('auto')
    setFormat('png')
    setStatus('idle')
    setCurrent(null)
  }

  function restore(item: HistoryItem) {
    setCurrent(item)
    setPrompt(item.prompt)
    changeModel(item.model)
    setSeed(item.seed)
    setRandomSeedOn(false)
    setFormat(item.format)
    setStatus('done')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/photopik.svg" alt="" />
          <div>
            <strong>Photopik</strong>
            <span>Text to image · OpenRouter</span>
          </div>
        </div>
        <div className="top-actions">
          <span className={connected ? 'pill ok' : 'pill'}>
            {connected ? 'Key configured' : 'Demo mode — no key'}
          </span>
          <button type="button" className="btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="panel" aria-label="Generation settings">
          <section aria-labelledby="conn-h">
            <h2 id="conn-h">OpenRouter <span>connection</span></h2>
            <div className="field">
              <label htmlFor="api-key">API key</label>
              <div className="row">
                <input
                  id="api-key" type={showKey ? 'text' : 'password'} autoComplete="off"
                  placeholder="sk-or-..." value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)} onBlur={saveKey}
                />
                <button type="button" className="btn shrink" onClick={() => setShowKey(!showKey)}>
                  {showKey ? 'Hide' : 'Show'}
                </button>
              </div>
              {keyError ? <small className="error-text" role="alert">{keyError}</small>
                : <small>Sent only to OpenRouter via your backend later. Never commit it.</small>}
            </div>
            <label className="check">
              <input type="checkbox" checked={rememberKey}
                onChange={(e) => { setRememberKey(e.target.checked); }} />
              Remember key on this device
            </label>
            <div className="field">
              <label htmlFor="base-url">Base URL</label>
              <input id="base-url" type="text" value="https://openrouter.ai/api/v1" readOnly />
            </div>
            <div className="field">
              <label htmlFor="model">Model</label>
              <select id="model" value={modelId} onChange={(e) => changeModel(e.target.value)}>
                {IMAGE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name} — {m.provider}</option>
                ))}
              </select>
              <small>{model.note} Model list is curated for now; live discovery comes with the backend.</small>
            </div>
          </section>

          <section aria-labelledby="prompt-h">
            <h2 id="prompt-h">Prompt</h2>
            <div className="field">
              <label htmlFor="prompt">Prompt <em>required</em></label>
              <textarea id="prompt" rows={4} value={prompt} aria-invalid={Boolean(promptError)}
                placeholder="A cozy coffee shop on a rainy night, neon sign, reflections on wet pavement"
                onChange={(e) => setPrompt(e.target.value)} />
              {promptError
                ? <small className="error-text" role="alert">{promptError}</small>
                : <small>{prompt.length} characters. Be specific about subject, style, and lighting.</small>}
            </div>
            <div className="field">
              <label htmlFor="negative">Negative prompt <em>optional</em></label>
              <textarea id="negative" rows={2} value={negativePrompt}
                disabled={!model.supportsNegativePrompt}
                placeholder="blurry, low quality, distorted hands"
                onChange={(e) => setNegativePrompt(e.target.value)} />
              <small>{model.supportsNegativePrompt
                ? 'Things the model should avoid.'
                : `${model.name} does not support a negative prompt, so this is disabled.`}</small>
            </div>
          </section>

          <section aria-labelledby="size-h">
            <h2 id="size-h">Size &amp; output</h2>
            <div className="field">
              <label>Aspect ratio</label>
              <div className="segmented" role="group" aria-label="Aspect ratio">
                {ASPECT_RATIOS.map((r) => (
                  <button key={r} type="button" aria-pressed={aspect === r && !customSize}
                    onClick={() => changeAspect(r)}>{r}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Resolution</label>
              <div className="segmented" role="group" aria-label="Resolution">
                {model.resolutions.map((r) => (
                  <button key={r} type="button" aria-pressed={resolution === r && !customSize}
                    onClick={() => changeResolution(r)}>{r}</button>
                ))}
              </div>
              <small>Output size: {width} × {height}px</small>
            </div>
            <div className="field">
              <label>Output format</label>
              <div className="segmented" role="group" aria-label="Output format">
                {model.formats.map((f) => (
                  <button key={f} type="button" aria-pressed={format === f}
                    onClick={() => setFormat(f)}>{f.toUpperCase()}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Image count</label>
              <div className="stepper">
                <button type="button" aria-label="Decrease count" onClick={() => setCount(Math.max(1, count - 1))}>−</button>
                <output aria-live="polite">{count}</output>
                <button type="button" aria-label="Increase count" onClick={() => setCount(Math.min(model.maxImages, count + 1))}>+</button>
              </div>
              <small>Variants per run. More images cost more on OpenRouter.</small>
            </div>
          </section>

          <details className="advanced">
            <summary>Advanced settings</summary>
            <div className="stack">
              <div className="field">
                <label htmlFor="seed">Seed</label>
                <div className="row">
                  <input id="seed" type="number" value={seed} disabled={randomSeedOn || !model.supportsSeed}
                    onChange={(e) => setSeed(Number(e.target.value))} />
                  <button type="button" className="btn shrink" disabled={!model.supportsSeed}
                    onClick={() => { setSeed(randomSeed()); setRandomSeedOn(false) }}>Randomize</button>
                </div>
                <label className="check">
                  <input type="checkbox" checked={randomSeedOn} disabled={!model.supportsSeed}
                    onChange={(e) => setRandomSeedOn(e.target.checked)} />
                  New random seed every run
                </label>
                <small>{model.supportsSeed
                  ? 'Same prompt + same seed reproduces the same image.'
                  : `${model.name} does not expose a seed, so this is disabled.`}</small>
              </div>
              {model.supportsQuality && (
                <div className="field">
                  <label>Quality</label>
                  <div className="segmented" role="group" aria-label="Quality">
                    {['auto', 'low', 'medium', 'high'].map((q) => (
                      <button key={q} type="button" aria-pressed={quality === q}
                        onClick={() => setQuality(q)}>{q}</button>
                    ))}
                  </div>
                  <small>Higher quality usually costs more and takes longer.</small>
                </div>
              )}
              <div className="field">
                <label>Custom dimensions</label>
                <label className="check">
                  <input type="checkbox" checked={customSize} onChange={(e) => setCustomSize(e.target.checked)} />
                  Override aspect ratio / resolution
                </label>
                <div className="row">
                  <input type="number" aria-label="Width" min={256} max={4096} step={8}
                    value={width} disabled={!customSize}
                    onChange={(e) => setWidth(Math.min(4096, Math.max(256, Number(e.target.value) || 256)))} />
                  <input type="number" aria-label="Height" min={256} max={4096} step={8}
                    value={height} disabled={!customSize}
                    onChange={(e) => setHeight(Math.min(4096, Math.max(256, Number(e.target.value) || 256)))} />
                </div>
                <small>Width × height in pixels, 256–4096. Some models reject uncommon sizes.</small>
              </div>
            </div>
          </details>

          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={generate}
              disabled={status === 'generating'}>
              {status === 'generating' ? 'Generating…' : 'Generate image'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={resetAll}>Reset all settings</button>
            {!connected && (
              <p className="notice demo">Demo preview mode: no valid OpenRouter key, so Generate shows a local placeholder. Add a key and connect the Flask backend for real images.</p>
            )}
          </div>
        </aside>

        <main className="stage">
          <section aria-labelledby="preview-h">
            <h2 id="preview-h">Preview</h2>
            <div className="preview-box" style={{ aspectRatio: `${width} / ${height}` }}>
              {status === 'generating' ? (
                <div className="empty" role="status">
                  <div className="spinner" aria-hidden="true" />
                  <strong>Generating…</strong>
                  <p>Sending your prompt to {model.name}. Real calls will go through Flask.</p>
                </div>
              ) : current ? (
                <img src={current.src} alt={current.prompt} />
              ) : (
                <div className="empty">
                  <strong>No image yet</strong>
                  <p>Write a prompt on the left and choose Generate image. Your result and settings will appear here.</p>
                </div>
              )}
            </div>
            {current && status !== 'generating' && (
              <>
                <p className="muted">{current.prompt}</p>
                <div className="meta" aria-label="Result details">
                  <span>{current.model}</span>
                  <span>seed {current.seed}</span>
                  <span>{current.width}×{current.height}</span>
                  <span>{current.format.toUpperCase()}</span>
                  <span>{current.at}</span>
                </div>
                <div className="row">
                  <a className="btn shrink" href={current.src} download={`photopik-${current.id}.svg`}>Download</a>
                  <button type="button" className="btn shrink"
                    onClick={() => { setSeed(current.seed); setRandomSeedOn(false) }}>
                    Reuse this seed
                  </button>
                </div>
              </>
            )}
          </section>

          <section aria-labelledby="history-h">
            <h2 id="history-h">Recent in this session</h2>
            {history.length === 0 ? (
              <p className="muted">Nothing generated yet in this session. History is not saved to a database yet.</p>
            ) : (
              <div className="history">
                {history.map((item) => (
                  <button key={item.id} type="button" onClick={() => restore(item)}
                    aria-current={current?.id === item.id}>
                    <img src={item.src} alt="" />
                    <small>{item.prompt}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}




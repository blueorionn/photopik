import { useEffect, useMemo, useState } from 'react'
import {
  fetchTextToImageModels,
  generateImage as generateImageFromApi,
  API_BASE_URL,
} from './lib/api'
import {
  DEFAULT_MODEL_ID,
  FALLBACK_CAPABILITIES,
  deriveCapabilities,
} from './lib/models'
import { dimensionsFor } from './utils/image'
import { type HistoryItem } from './types/history'
import type { ImageModel } from './types/models'
import { randomSeed } from './utils/base'
import { Sun, Moon, ChevronDown } from 'lucide-react'

const SETTINGS_KEY = 'photopik-settings'

function loadSettings(): Record<string, unknown> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') as Record<
      string,
      unknown
    >
  } catch {
    return {}
  }
}

export default function App() {
  const [saved] = useState(loadSettings)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )
  const [models, setModels] = useState<ImageModel[]>([])
  const [modelsStatus, setModelsStatus] = useState<
    'loading' | 'ready' | 'error'
  >('loading')
  const [modelsReload, setModelsReload] = useState(0)
  const [modelId, setModelId] = useState('')
  const [prompt, setPrompt] = useState(() =>
    typeof saved.prompt === 'string' ? saved.prompt : ''
  )
  const [negativePrompt, setNegativePrompt] = useState('')
  const [aspect, setAspect] = useState<string>(() =>
    typeof saved.aspect === 'string' ? saved.aspect : '1:1'
  )
  const [resolution, setResolution] = useState(() =>
    typeof saved.resolution === 'string' ? saved.resolution : '1K'
  )
  const [customSize, setCustomSize] = useState(false)
  const [width, setWidth] = useState(
    () =>
      dimensionsFor(
        typeof saved.aspect === 'string' ? saved.aspect : '1:1',
        typeof saved.resolution === 'string' ? saved.resolution : '1K'
      ).width
  )
  const [height, setHeight] = useState(
    () =>
      dimensionsFor(
        typeof saved.aspect === 'string' ? saved.aspect : '1:1',
        typeof saved.resolution === 'string' ? saved.resolution : '1K'
      ).height
  )
  const [seed, setSeed] = useState(randomSeed)
  const [randomSeedOn, setRandomSeedOn] = useState(true)
  const [count, setCount] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [format, setFormat] = useState('png')
  const [promptError, setPromptError] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'generating' | 'done' | 'error'
  >('idle')
  const [current, setCurrent] = useState<HistoryItem | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [genError, setGenError] = useState('')
  const [genProgress, setGenProgress] = useState('')

  const model = useMemo(
    () => models.find((m) => m.id === modelId),
    [models, modelId]
  )
  const caps = useMemo(
    () => (model ? deriveCapabilities(model) : FALLBACK_CAPABILITIES),
    [model]
  )

  useEffect(() => {
    const controller = new AbortController()
    fetchTextToImageModels(controller.signal)
      .then((list) => {
        setModels(list)
        setModelsStatus('ready')
        const savedId = typeof saved.modelId === 'string' ? saved.modelId : ''
        const pick =
          list.find((m) => m.id === savedId)?.id ??
          list.find((m) => m.id === DEFAULT_MODEL_ID)?.id ??
          list[0]?.id ??
          ''
        if (pick) changeModel(pick, list)
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setModelsStatus('error')
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsReload])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('photopik-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!modelId) return
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ prompt, modelId, aspect, resolution })
    )
  }, [prompt, modelId, aspect, resolution])

  function changeModel(id: string, list: ImageModel[] = models) {
    const next = list.find((m) => m.id === id)
    if (!next) return
    const nextCaps = deriveCapabilities(next)
    setModelId(id)
    const nextAspect = nextCaps.aspectRatios.includes(aspect)
      ? aspect
      : (nextCaps.aspectRatios.find((r) => r === '1:1') ??
        nextCaps.aspectRatios[0] ??
        '1:1')
    const nextResolution = nextCaps.resolutions.includes(resolution)
      ? resolution
      : (nextCaps.resolutions[0] ?? '1K')
    if (nextAspect !== aspect) setAspect(nextAspect)
    if (nextResolution !== resolution) setResolution(nextResolution)
    if (!customSize) {
      const d = dimensionsFor(nextAspect, nextResolution)
      setWidth(d.width)
      setHeight(d.height)
    }
    if (count > nextCaps.maxImages) setCount(nextCaps.maxImages)
    if (!nextCaps.formats.includes(format)) setFormat(nextCaps.formats[0])
    if (
      nextCaps.qualityValues.length > 0 &&
      !nextCaps.qualityValues.includes(quality)
    )
      setQuality(nextCaps.qualityValues[0])
  }

  function changeAspect(value: string) {
    setAspect(value)
    setCustomSize(false)
    const d = dimensionsFor(value, resolution)
    setWidth(d.width)
    setHeight(d.height)
  }

  function changeResolution(value: string) {
    setResolution(value)
    setCustomSize(false)
    const d = dimensionsFor(aspect, value)
    setWidth(d.width)
    setHeight(d.height)
  }

  async function generate() {
    if (!model) {
      setPromptError('No model loaded yet. Wait for models to load, or retry.')
      return
    }
    if (!prompt.trim()) {
      setPromptError('Prompt is required. Describe the image you want.')
      return
    }
    setPromptError('')
    setGenError('')
    const baseSeed = randomSeedOn ? randomSeed() : seed
    if (randomSeedOn) setSeed(baseSeed)
    setStatus('generating')

    const items: HistoryItem[] = []
    try {
      for (let i = 0; i < count; i++) {
        const usedSeed = caps.supportsSeed ? baseSeed + i : baseSeed
        setGenProgress(
          count > 1 ? `Generating image ${i + 1} of ${count}…` : 'Generating…'
        )
        const controller = new AbortController()
        const timer = window.setTimeout(() => controller.abort(), 180_000)
        try {
          const src = await generateImageFromApi(
            {
              prompt: prompt.trim(),
              model: modelId,
              ...(caps.supportsNegativePrompt && negativePrompt.trim()
                ? { negative_prompt: negativePrompt.trim() }
                : {}),
              aspect_ratio: aspect,
              resolution,
              ...(caps.supportsSeed ? { seed: usedSeed } : {}),
              n: 1,
              ...(caps.qualityValues.length > 0 ? { quality } : {}),
              output_format: format,
              width,
              height,
            },
            controller.signal
          )
          items.push({
            id: Date.now() + i,
            src,
            prompt: prompt.trim(),
            model: modelId,
            seed: usedSeed,
            width,
            height,
            format,
            at: new Date().toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          })
        } finally {
          window.clearTimeout(timer)
        }
      }
      setCurrent(items[0])
      setHistory((h) => [...items, ...h].slice(0, 12))
      setStatus('done')
    } catch (err) {
      if (items.length > 0) {
        setCurrent(items[0])
        setHistory((h) => [...items, ...h].slice(0, 12))
        setStatus('done')
        setGenError(
          `Generated ${items.length} of ${count} images, then the API failed.`
        )
      } else {
        setStatus('error')
        setGenError(
          err instanceof DOMException && err.name === 'AbortError'
            ? 'Generation timed out after 180 seconds. Try again or pick a faster model.'
            : err instanceof Error
              ? err.message
              : 'Generation failed. Check that the API server is running.'
        )
      }
    } finally {
      setGenProgress('')
    }
  }

  function resetAll() {
    setPrompt('')
    setNegativePrompt('')
    setAspect('1:1')
    setResolution('1K')
    setCustomSize(false)
    setWidth(1024)
    setHeight(1024)
    setSeed(randomSeed())
    setCount(1)
    setQuality('auto')
    setFormat('png')
    setStatus('idle')
    setCurrent(null)
    setGenError('')
  }

  function restore(item: HistoryItem) {
    setCurrent(item)
    setPrompt(item.prompt)
    changeModel(item.model)
    setSeed(item.seed)
    setRandomSeedOn(false)
    setFormat(item.format)
    // History items store exact dimensions, not aspect/resolution.
    // Keep them as a custom size so the preview matches the image.
    setWidth(item.width)
    setHeight(item.height)
    setCustomSize(true)
    setStatus('done')
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:bg-surface disabled:text-muted'
  const labelCls =
    'text-[13px] font-semibold [&_em]:font-normal [&_em]:not-italic [&_em]:text-muted'
  const hintCls = 'text-xs leading-relaxed text-muted'
  const btnCls =
    'shrink-0 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold hover:border-accent disabled:cursor-not-allowed disabled:opacity-55'
  const segCls = (active: boolean) =>
    `rounded-md border px-2.5 py-1.5 text-[13px] font-semibold ${active ? 'border-accent bg-accent text-white' : 'border-border bg-background hover:border-accent'}`
  const fieldCls = 'flex flex-col gap-1.5'
  const selectCls =
    'w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface py-2 pr-9 pl-3 text-sm font-medium shadow-sm transition-colors hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/25 focus:outline-none disabled:cursor-not-allowed disabled:opacity-55'

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='border-border bg-background sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-3.5'>
        <div className='flex items-center gap-3'>
          <img src='/photopik.svg' alt='' className='h-8 w-8' />
          <div>
            <strong className='block text-[19px] leading-tight tracking-tight'>
              Photopik
            </strong>
          </div>
        </div>
        <div className='flex items-center gap-2.5'>
          <button
            type='button'
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className='border-border bg-surface text-muted hover:border-accent hover:bg-accent grid h-9 w-9 shrink-0 place-items-center rounded border transition-colors duration-200 hover:text-white active:scale-95 [&_svg]:h-4.5 [&_svg]:w-4.5'
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun /> : <Moon />}
          </button>
        </div>
      </header>

      <div className='grid flex-1 items-start lg:grid-cols-[390px_minmax(0,1fr)]'>
        <aside
          className='border-border flex flex-col gap-6 overflow-y-auto border-b p-5 lg:sticky lg:top-16.25 lg:max-h-[calc(100vh-65px)] lg:border-r lg:border-b-0'
          aria-label='Generation settings'
        >
          <section className='flex flex-col gap-2.5' aria-labelledby='conn-h'>
            <h2 id='conn-h' className='m-0 text-sm font-bold'>
              Model{' '}
              <span className='text-muted font-normal'>via OpenRouter</span>
            </h2>
            <div className={fieldCls}>
              <label htmlFor='model' className={labelCls}>
                Model
              </label>
              <div className='relative'>
                <select
                  id='model'
                  value={modelId}
                  disabled={modelsStatus !== 'ready'}
                  onChange={(e) => changeModel(e.target.value)}
                  className={selectCls}
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className='text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2'
                  aria-hidden='true'
                />
              </div>
              {modelsStatus === 'loading' ? (
                <small className={hintCls}>
                  Loading models from the API server…
                </small>
              ) : modelsStatus === 'error' ? (
                <>
                  <small className='text-danger text-xs' role='alert'>
                    Could not load models from {API_BASE_URL}/models. Is the API
                    server running?
                  </small>
                  <button
                    type='button'
                    className={btnCls}
                    onClick={() => {
                      setModelsStatus('loading')
                      setModelsReload((n) => n + 1)
                    }}
                  >
                    Retry
                  </button>
                </>
              ) : model ? (
                <small className={hintCls}>
                  {model.description.slice(0, 160)}
                  {model.description.length > 160 ? '…' : ''}
                </small>
              ) : (
                <small className={hintCls}>
                  No models returned by the API server.
                </small>
              )}
            </div>
          </section>

          <section className='flex flex-col gap-2.5' aria-labelledby='prompt-h'>
            <h2 id='prompt-h' className='m-0 text-sm font-bold'>
              Prompt
            </h2>
            <div className={fieldCls}>
              <label htmlFor='prompt' className={labelCls}>
                Prompt <em>required</em>
              </label>
              <textarea
                id='prompt'
                rows={4}
                value={prompt}
                aria-invalid={Boolean(promptError)}
                placeholder='A cozy coffee shop on a rainy night, neon sign, reflections on wet pavement'
                onChange={(e) => setPrompt(e.target.value)}
                className={`${inputCls} min-h-21 resize-y`}
              />
              {promptError ? (
                <small className='text-danger text-xs' role='alert'>
                  {promptError}
                </small>
              ) : (
                <small className={hintCls}>
                  {prompt.length} characters. Be specific about subject, style,
                  and lighting.
                </small>
              )}
            </div>
            <div className={fieldCls}>
              <label htmlFor='negative' className={labelCls}>
                Negative prompt <em>optional</em>
              </label>
              <small className={hintCls}>
                {caps.supportsNegativePrompt
                  ? 'Things the model should avoid.'
                  : `${model?.name ?? 'This model'} does not declare negative prompt support, so this is disabled.`}
              </small>
              <textarea
                id='negative'
                rows={2}
                value={negativePrompt}
                disabled={!caps.supportsNegativePrompt}
                placeholder='blurry, low quality, distorted hands'
                onChange={(e) => setNegativePrompt(e.target.value)}
                className={`${inputCls} resize-y`}
              />
            </div>
          </section>

          <section className='flex flex-col gap-2.5' aria-labelledby='count-h'>
            <h2 id='count-h' className='m-0 text-sm font-bold'>
              Image count
            </h2>
            <div className={fieldCls}>
              <div className='flex items-center gap-2.5'>
                <button
                  type='button'
                  aria-label='Decrease count'
                  onClick={() => setCount(Math.max(1, count - 1))}
                  className='border-border bg-background hover:border-accent h-8.5 w-8.5 rounded-lg border text-[17px]'
                >
                  −
                </button>
                <output
                  aria-live='polite'
                  className='min-w-5 text-center font-bold'
                >
                  {count}
                </output>
                <button
                  type='button'
                  aria-label='Increase count'
                  onClick={() => setCount(Math.min(caps.maxImages, count + 1))}
                  className='border-border bg-background hover:border-accent h-8.5 w-8.5 rounded-lg border text-[17px]'
                >
                  +
                </button>
              </div>
              <small className={hintCls}>
                Variants per run. More images cost more on OpenRouter.
              </small>
            </div>
          </section>

          <section className='flex flex-col gap-2.5' aria-labelledby='size-h'>
            <h2 id='size-h' className='m-0 text-sm font-bold'>
              Size &amp; output
            </h2>
            <div className='grid grid-cols-2 gap-3'>
              <div className={fieldCls}>
                <label htmlFor='aspect-ratio' className={labelCls}>
                  Aspect ratio
                </label>
                <div className='relative'>
                  <select
                    id='aspect-ratio'
                    value={aspect}
                    onChange={(e) => changeAspect(e.target.value)}
                    className={selectCls}
                  >
                    {caps.aspectRatios.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className='text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2'
                    aria-hidden='true'
                  />
                </div>
              </div>
              <div className={fieldCls}>
                <label htmlFor='resolution' className={labelCls}>
                  Resolution
                </label>
                <div className='relative'>
                  <select
                    id='resolution'
                    value={resolution}
                    onChange={(e) => changeResolution(e.target.value)}
                    className={selectCls}
                  >
                    {caps.resolutions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className='text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2'
                    aria-hidden='true'
                  />
                </div>
              </div>
              <div className={fieldCls}>
                <label htmlFor='output-format' className={labelCls}>
                  Output format
                </label>
                <div className='relative'>
                  <select
                    id='output-format'
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className={selectCls}
                  >
                    {caps.formats.map((f) => (
                      <option key={f} value={f}>
                        {f.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className='text-muted pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2'
                    aria-hidden='true'
                  />
                </div>
              </div>
              <div className='flex items-end'>
                <p className='border-border bg-surface text-muted m-0 w-full rounded-lg border px-3 py-2 text-xs'>
                  Output size:{' '}
                  <span className='text-foreground font-mono font-semibold'>
                    {width} × {height}px
                  </span>
                  {customSize && ' · custom'}
                </p>
              </div>
            </div>
          </section>

          <details className='border-border border-t pt-3.5'>
            <summary className='mb-3 cursor-pointer text-[13px] font-bold'>
              Advanced settings
            </summary>
            <div className='flex flex-col gap-3'>
              <div className={fieldCls}>
                <label htmlFor='seed' className={labelCls}>
                  Seed
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    id='seed'
                    type='number'
                    value={seed}
                    disabled={randomSeedOn || !caps.supportsSeed}
                    onChange={(e) => setSeed(Number(e.target.value))}
                    className={inputCls}
                  />
                  <button
                    type='button'
                    className={btnCls}
                    disabled={!caps.supportsSeed}
                    onClick={() => {
                      setSeed(randomSeed())
                      setRandomSeedOn(false)
                    }}
                  >
                    Randomize
                  </button>
                </div>
                <label className='flex items-center gap-2 text-[13px]'>
                  <input
                    type='checkbox'
                    checked={randomSeedOn}
                    disabled={!caps.supportsSeed}
                    onChange={(e) => setRandomSeedOn(e.target.checked)}
                  />
                  New random seed every run
                </label>
                <small className={hintCls}>
                  {caps.supportsSeed
                    ? 'Same prompt + same seed reproduces the same image.'
                    : `${model?.name ?? 'This model'} does not expose a seed, so this is disabled.`}
                </small>
              </div>
              {caps.qualityValues.length > 0 && (
                <div className={fieldCls}>
                  <label className={labelCls}>Quality</label>
                  <div
                    className='flex flex-wrap gap-1.5'
                    role='group'
                    aria-label='Quality'
                  >
                    {caps.qualityValues.map((q) => (
                      <button
                        key={q}
                        type='button'
                        aria-pressed={quality === q}
                        onClick={() => setQuality(q)}
                        className={segCls(quality === q)}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <small className={hintCls}>
                    Higher quality usually costs more and takes longer.
                  </small>
                </div>
              )}
              <div className={fieldCls}>
                <label className={labelCls}>Custom dimensions</label>
                <label className='flex items-center gap-2 text-[13px]'>
                  <input
                    type='checkbox'
                    checked={customSize}
                    onChange={(e) => setCustomSize(e.target.checked)}
                  />
                  Override aspect ratio / resolution
                </label>
                <div className='flex items-center gap-2'>
                  <input
                    type='number'
                    aria-label='Width'
                    min={256}
                    max={4096}
                    step={8}
                    value={width}
                    disabled={!customSize}
                    className={inputCls}
                    onChange={(e) =>
                      setWidth(
                        Math.min(
                          4096,
                          Math.max(256, Number(e.target.value) || 256)
                        )
                      )
                    }
                  />
                  <input
                    type='number'
                    aria-label='Height'
                    min={256}
                    max={4096}
                    step={8}
                    value={height}
                    disabled={!customSize}
                    className={inputCls}
                    onChange={(e) =>
                      setHeight(
                        Math.min(
                          4096,
                          Math.max(256, Number(e.target.value) || 256)
                        )
                      )
                    }
                  />
                </div>
                <small className={hintCls}>
                  Width × height in pixels, 256–4096. Some models reject
                  uncommon sizes.
                </small>
              </div>
            </div>
          </details>

          <div className='flex flex-col gap-2'>
            <button
              type='button'
              onClick={generate}
              disabled={status === 'generating'}
              className='border-accent bg-accent hover:bg-accent-hover w-full rounded-lg border px-4 py-3 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-55'
            >
              {status === 'generating'
                ? genProgress || 'Generating…'
                : 'Generate image'}
            </button>
            <button
              type='button'
              className='hover:text-accent-hover rounded-lg px-3.5 py-2 text-sm font-semibold'
              onClick={resetAll}
            >
              Reset all settings
            </button>
            {genError && (
              <p
                className='border-border bg-danger-bg text-danger rounded-lg border px-3 py-2.5 text-[13px] leading-relaxed'
                role='alert'
              >
                {genError}
              </p>
            )}
          </div>
        </aside>

        <main className='flex min-w-0 flex-col gap-5 p-5'>
          <section className='flex flex-col gap-3' aria-labelledby='preview-h'>
            <h2 id='preview-h' className='m-0 text-sm font-bold'>
              Preview
            </h2>
            <div
              className='border-border bg-surface flex min-h-85 items-center justify-center overflow-hidden rounded-xl border'
              style={{ aspectRatio: `${width} / ${height}` }}
            >
              {status === 'generating' ? (
                <div
                  className='text-muted max-w-105 p-10 text-center'
                  role='status'
                >
                  <div
                    className='border-border border-t-accent mx-auto mb-3.5 h-8.5 w-8.5 animate-spin rounded-full border-[3px] motion-reduce:animate-none'
                    aria-hidden='true'
                  />
                  <strong className='text-foreground mb-1.5 block text-[17px]'>
                    Generating…
                  </strong>
                  <p className='m-0 text-sm'>
                    {genProgress ||
                      `Sending your prompt to ${model?.name ?? 'the model'}…`}
                  </p>
                </div>
              ) : status === 'error' ? (
                <div
                  className='text-muted max-w-105 p-10 text-center'
                  role='alert'
                >
                  <strong className='text-danger mb-1.5 block text-[17px]'>
                    Generation failed
                  </strong>
                  <p className='m-0 text-sm'>
                    {genError || 'Something went wrong. Try again.'}
                  </p>
                </div>
              ) : current ? (
                <img
                  src={current.src}
                  alt={current.prompt}
                  className='block h-full w-full object-contain'
                />
              ) : (
                <div className='text-muted max-w-105 p-10 text-center'>
                  <strong className='text-foreground mb-1.5 block text-[17px]'>
                    No image yet
                  </strong>
                  <p className='m-0 text-sm'>
                    Write a prompt on the left and choose Generate image. Your
                    result and settings will appear here.
                  </p>
                </div>
              )}
            </div>
            {current && status === 'done' && (
              <>
                <p className='text-muted m-0 text-sm'>{current.prompt}</p>
                <div
                  className='flex flex-wrap gap-2'
                  aria-label='Result details'
                >
                  {[
                    current.model,
                    `seed ${current.seed}`,
                    `${current.width}×${current.height}`,
                    current.format.toUpperCase(),
                    current.at,
                  ].map((chip) => (
                    <span
                      key={chip}
                      className='border-border bg-surface rounded-md border px-2 py-1 font-mono text-xs'
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className='flex gap-2'>
                  <a
                    className={btnCls}
                    href={current.src}
                    download={`photopik-${current.id}.${current.format}`}
                  >
                    Download
                  </a>
                  <button
                    type='button'
                    className={btnCls}
                    onClick={() => {
                      setSeed(current.seed)
                      setRandomSeedOn(false)
                    }}
                  >
                    Reuse this seed
                  </button>
                </div>
              </>
            )}
          </section>

          <section className='flex flex-col gap-3' aria-labelledby='history-h'>
            <h2 id='history-h' className='m-0 text-sm font-bold'>
              Recent in this session
            </h2>
            {history.length === 0 ? (
              <p className='text-muted m-0 text-sm'>
                Nothing generated yet in this session. History is not saved to a
                database yet.
              </p>
            ) : (
              <div className='grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5'>
                {history.map((item) => (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => restore(item)}
                    aria-current={current?.id === item.id}
                    className={`bg-surface overflow-hidden rounded-lg border-2 p-0 text-left ${current?.id === item.id ? 'border-accent' : 'border-border'}`}
                  >
                    <img
                      src={item.src}
                      alt=''
                      className='block aspect-4/3 w-full object-cover'
                    />
                    <small className='text-muted block truncate px-2 py-1.5 text-[11.5px]'>
                      {item.prompt}
                    </small>
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

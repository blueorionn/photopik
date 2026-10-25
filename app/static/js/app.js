// Vanilla port of web/src/App.tsx + lib/api.ts + lib/models.ts + utils/*.
// Same state defaults, localStorage keys, messages, and API contract.
'use strict'

const SETTINGS_KEY = 'photopik-settings'
const API_BASE_URL = window.location.origin
const DEFAULT_MODEL_ID = 'qwen/qwen-image-2.1-turbo'
const FALLBACK_CAPABILITIES = {
  aspectRatios: ['1:1'],
  resolutions: ['1K'],
  supportsSeed: false,
  supportsNegativePrompt: false,
  qualityValues: [],
  maxImages: 1,
  formats: ['png'],
}

function randomSeed() {
  return Math.floor(Math.random() * 999_999_999)
}

function dimensionsFor(aspect, resolution) {
  const base = resolution === '4K' ? 2048 : resolution === '2K' ? 1536 : 1024
  const [rw, rh] = aspect.split(':').map(Number)
  if (!rw || !rh) return { width: base, height: base }
  if (rw >= rh) return { width: base, height: Math.round((base * rh) / rw / 8) * 8 }
  return { width: Math.round((base * rw) / rh / 8) * 8, height: base }
}

function enumValues(params, key) {
  const param = params[key]
  if (!param || param.type !== 'enum') return []
  return param.values.map(String)
}

function deriveCapabilities(model) {
  const params = model.supported_parameters
  const nParam = params['n']
  const formats = enumValues(params, 'output_format')
  const aspectRatios = enumValues(params, 'aspect_ratio')
  const resolutions = enumValues(params, 'resolution')
  return {
    aspectRatios: aspectRatios.length > 0 ? aspectRatios : ['1:1'],
    resolutions: resolutions.length > 0 ? resolutions : ['1K'],
    supportsSeed: params['seed']?.type === 'boolean',
    supportsNegativePrompt: 'negative_prompt' in params,
    qualityValues: enumValues(params, 'quality'),
    maxImages: nParam?.type === 'range' ? Math.max(1, Math.floor(nParam.max)) : 1,
    formats: formats.length > 0 ? formats : ['png'],
  }
}

async function fetchTextToImageModels(signal, source) {
  const response = await fetch(`${API_BASE_URL}/models?source=${encodeURIComponent(source || 'openrouter')}`, { signal })
  if (!response.ok) throw new Error(`GET /models failed with ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('GET /models returned an unexpected shape')
  return data
}

async function generateImageFromApi(request, signal) {
  const response = await fetch(`${API_BASE_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : typeof payload === 'string'
          ? payload
          : `POST /generate failed with ${response.status}`
    throw new Error(message)
  }
  const image =
    payload && typeof payload === 'object' && 'data' in payload && payload.data && typeof payload.data === 'object'
      ? payload.data.image
      : undefined
  if (typeof image !== 'string' || image.length === 0) {
    throw new Error('POST /generate returned no image data')
  }
  if (image.startsWith('data:')) return image
  const mime = request.output_format === 'jpg' ? 'image/jpeg' : `image/${request.output_format}`
  return `data:${mime};base64,${image}`
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

const saved = loadSettings()
const initialAspect = typeof saved.aspect === 'string' ? saved.aspect : '1:1'
const initialResolution = typeof saved.resolution === 'string' ? saved.resolution : '1K'
const initialDims = dimensionsFor(initialAspect, initialResolution)

const state = {
  theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  source: 'openrouter',
  models: [],
  modelsStatus: 'loading',
  modelId: '',
  prompt: typeof saved.prompt === 'string' ? saved.prompt : '',
  negativePrompt: '',
  aspect: initialAspect,
  resolution: initialResolution,
  customSize: false,
  width: initialDims.width,
  height: initialDims.height,
  seed: randomSeed(),
  randomSeedOn: true,
  count: 1,
  quality: 'auto',
  format: 'png',
  promptError: '',
  status: 'idle',
  current: null,
  history: [],
  genError: '',
  genProgress: '',
}

const el = (id) => document.getElementById(id)
const els = {
  source: el('source'),
  themeToggle: el('theme-toggle'),
  themeSun: el('theme-icon-sun'),
  themeMoon: el('theme-icon-moon'),
  model: el('model'),
  modelLoading: el('model-loading'),
  modelError: el('model-error'),
  modelRetry: el('model-retry'),
  modelDescription: el('model-description'),
  modelEmpty: el('model-empty'),
  prompt: el('prompt'),
  promptError: el('prompt-error'),
  promptHint: el('prompt-hint'),
  negative: el('negative'),
  negativeHint: el('negative-hint'),
  countValue: el('count-value'),
  aspect: el('aspect-ratio'),
  resolution: el('resolution'),
  format: el('output-format'),
  outputSize: el('output-size'),
  outputSizeCustom: el('output-size-custom'),
  seed: el('seed'),
  seedRandomize: el('seed-randomize'),
  seedRandom: el('seed-random'),
  seedHint: el('seed-hint'),
  qualityField: el('quality-field'),
  qualityGroup: el('quality-group'),
  customSize: el('custom-size'),
  width: el('width'),
  height: el('height'),
  generate: el('generate'),
  genError: el('gen-error'),
  previewSection: el('preview-section'),
  previewBox: el('preview-box'),
  previewGenerating: el('preview-generating'),
  previewGeneratingText: el('preview-generating-text'),
  previewError: el('preview-error'),
  previewErrorText: el('preview-error-text'),
  previewImg: el('preview-img'),
  previewEmpty: el('preview-empty'),
  previewDetails: el('preview-details'),
  resultPrompt: el('result-prompt'),
  resultChips: el('result-chips'),
  resultDownload: el('result-download'),
  resultReuseSeed: el('result-reuse-seed'),
  historyEmpty: el('history-empty'),
  historyGrid: el('history-grid'),
}

function currentModel() {
  return state.models.find((m) => m.id === state.modelId)
}
function caps() {
  const model = currentModel()
  return model ? deriveCapabilities(model) : FALLBACK_CAPABILITIES
}

function saveSettings() {
  if (!state.modelId) return
  localStorage.setItem(
    SETTINGS_KEY,
    JSON.stringify({
      prompt: state.prompt,
      modelId: state.modelId,
      aspect: state.aspect,
      resolution: state.resolution,
    })
  )
}

function fillSelect(select, values, value, label) {
  select.innerHTML = ''
  for (const v of values) {
    const opt = document.createElement('option')
    opt.value = v
    opt.textContent = label ? label(v) : v
    select.appendChild(opt)
  }
  select.value = value
}

function syncTheme() {
  const next = state.theme === 'dark' ? 'light' : 'dark'
  els.themeToggle.setAttribute('aria-label', `Switch to ${next} theme`)
  els.themeToggle.setAttribute('title', `Switch to ${next} theme`)
  els.themeSun.hidden = state.theme !== 'dark'
  els.themeMoon.hidden = state.theme === 'dark'
}

function syncModelHint() {
  const model = currentModel()
  els.model.disabled = state.modelsStatus !== 'ready'
  els.modelLoading.hidden = state.modelsStatus !== 'loading'
  const isError = state.modelsStatus === 'error'
  els.modelError.hidden = !isError
  els.modelRetry.hidden = !isError
  if (isError) {
    els.modelError.textContent = `Could not load models from ${API_BASE_URL}/models. Is the API server running?`
  }
  const showDesc = state.modelsStatus === 'ready' && Boolean(model)
  els.modelDescription.hidden = !showDesc
  if (showDesc) {
    els.modelDescription.textContent =
      model.description.slice(0, 160) + (model.description.length > 160 ? '…' : '')
  }
  els.modelEmpty.hidden = !(state.modelsStatus === 'ready' && !model)
}

function syncForm() {
  const c = caps()
  const model = currentModel()
  if (document.activeElement !== els.prompt) els.prompt.value = state.prompt
  els.prompt.setAttribute('aria-invalid', String(Boolean(state.promptError)))
  els.promptError.hidden = !state.promptError
  els.promptError.textContent = state.promptError
  els.promptHint.hidden = Boolean(state.promptError)
  els.promptHint.textContent = `${state.prompt.length} characters. Be specific about subject, style, and lighting.`

  els.negative.value = state.negativePrompt
  els.negative.disabled = !c.supportsNegativePrompt
  els.negativeHint.textContent = c.supportsNegativePrompt
    ? 'Things the model should avoid.'
    : `${model?.name ?? 'This model'} does not declare negative prompt support, so this is disabled.`

  els.countValue.textContent = String(state.count)

  if (els.source) els.source.value = state.source
  els.model.innerHTML = ''
  for (const m of state.models) {
    const opt = document.createElement('option')
    opt.value = m.id
    opt.textContent = m.name
    els.model.appendChild(opt)
  }
  els.model.value = state.modelId
  syncModelHint()

  fillSelect(els.aspect, c.aspectRatios, state.aspect)
  fillSelect(els.resolution, c.resolutions, state.resolution)
  fillSelect(els.format, c.formats, state.format, (f) => f.toUpperCase())

  els.outputSize.textContent = `${state.width} × ${state.height}px`
  els.outputSizeCustom.hidden = !state.customSize

  els.seed.value = String(state.seed)
  els.seed.disabled = state.randomSeedOn || !c.supportsSeed
  els.seedRandomize.disabled = !c.supportsSeed
  els.seedRandom.checked = state.randomSeedOn
  els.seedRandom.disabled = !c.supportsSeed
  els.seedHint.textContent = c.supportsSeed
    ? 'Same prompt + same seed reproduces the same image.'
    : `${model?.name ?? 'This model'} does not expose a seed, so this is disabled.`

  els.qualityField.hidden = c.qualityValues.length === 0
  els.qualityGroup.innerHTML = ''
  for (const q of c.qualityValues) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'seg-btn' + (state.quality === q ? ' active' : '')
    btn.setAttribute('aria-pressed', String(state.quality === q))
    btn.textContent = q
    btn.addEventListener('click', () => {
      state.quality = q
      syncForm()
    })
    els.qualityGroup.appendChild(btn)
  }

  els.customSize.checked = state.customSize
  els.width.value = String(state.width)
  els.height.value = String(state.height)
  els.width.disabled = !state.customSize
  els.height.disabled = !state.customSize

  els.generate.disabled = state.status === 'generating'
  els.generate.textContent =
    state.status === 'generating' ? state.genProgress || 'Generating…' : 'Generate image'
  els.genError.hidden = !state.genError
  els.genError.textContent = state.genError
}

function syncPreview() {
  els.previewBox.style.aspectRatio = `${state.width} / ${state.height}`
  const generating = state.status === 'generating'
  const failed = state.status === 'error'
  els.previewGenerating.hidden = !generating
  els.previewError.hidden = !failed
  els.previewImg.hidden = !(state.current && !generating && !failed)
  els.previewEmpty.hidden = Boolean(state.current || generating || failed)
  if (generating) {
    els.previewGeneratingText.textContent =
      state.genProgress || `Sending your prompt to ${currentModel()?.name ?? 'the model'}…`
  }
  if (failed) {
    els.previewErrorText.textContent = state.genError || 'Something went wrong. Try again.'
  }
  if (state.current) {
    els.previewImg.src = state.current.src
    els.previewImg.alt = state.current.prompt
  }
  const showDetails = Boolean(state.current && state.status === 'done')
  els.previewDetails.hidden = !showDetails
  if (showDetails) {
    els.resultPrompt.textContent = state.current.prompt
    els.resultChips.innerHTML = ''
    const chips = [
      state.current.model,
      `seed ${state.current.seed}`,
      `${state.current.width}×${state.current.height}`,
      state.current.format.toUpperCase(),
      state.current.at,
    ]
    for (const chip of chips) {
      const span = document.createElement('span')
      span.className = 'chip'
      span.textContent = chip
      els.resultChips.appendChild(span)
    }
    els.resultDownload.href = state.current.src
    els.resultDownload.setAttribute(
      'download',
      `photopik-${state.current.id}.${state.current.format}`
    )
  }
}

function syncHistory() {
  els.historyEmpty.hidden = state.history.length !== 0
  els.historyGrid.hidden = state.history.length === 0
  els.historyGrid.innerHTML = ''
  for (const item of state.history) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'history-item' + (state.current?.id === item.id ? ' active' : '')
    if (state.current?.id === item.id) btn.setAttribute('aria-current', 'true')
    const img = document.createElement('img')
    img.src = item.src
    img.alt = ''
    img.className = 'history-img'
    const label = document.createElement('small')
    label.className = 'history-label'
    label.textContent = item.prompt
    btn.appendChild(img)
    btn.appendChild(label)
    btn.addEventListener('click', () => restore(item))
    els.historyGrid.appendChild(btn)
  }
}

function syncUI() {
  syncTheme()
  syncForm()
  syncPreview()
  syncHistory()
}

function changeModel(id, list) {
  const models = list || state.models
  const next = models.find((m) => m.id === id)
  if (!next) return
  const nextCaps = deriveCapabilities(next)
  state.modelId = id
  const nextAspect = nextCaps.aspectRatios.includes(state.aspect)
    ? state.aspect
    : (nextCaps.aspectRatios.find((r) => r === '1:1') ?? nextCaps.aspectRatios[0] ?? '1:1')
  const nextResolution = nextCaps.resolutions.includes(state.resolution)
    ? state.resolution
    : (nextCaps.resolutions[0] ?? '1K')
  state.aspect = nextAspect
  state.resolution = nextResolution
  if (!state.customSize) {
    const d = dimensionsFor(nextAspect, nextResolution)
    state.width = d.width
    state.height = d.height
  }
  if (state.count > nextCaps.maxImages) state.count = nextCaps.maxImages
  if (!nextCaps.formats.includes(state.format)) state.format = nextCaps.formats[0]
  if (nextCaps.qualityValues.length > 0 && !nextCaps.qualityValues.includes(state.quality)) {
    state.quality = nextCaps.qualityValues[0]
  }
}

function changeAspect(value) {
  state.aspect = value
  state.customSize = false
  const d = dimensionsFor(value, state.resolution)
  state.width = d.width
  state.height = d.height
}

function changeResolution(value) {
  state.resolution = value
  state.customSize = false
  const d = dimensionsFor(state.aspect, value)
  state.width = d.width
  state.height = d.height
}

async function generate() {
  if (!currentModel()) {
    state.promptError = 'No model loaded yet. Wait for models to load, or retry.'
    syncUI()
    return
  }
  if (!state.prompt.trim()) {
    state.promptError = 'Prompt is required. Describe the image you want.'
    syncUI()
    return
  }
  state.promptError = ''
  state.genError = ''
  const c = caps()
  const baseSeed = state.randomSeedOn ? randomSeed() : state.seed
  if (state.randomSeedOn) state.seed = baseSeed
  state.status = 'generating'
  syncUI()

  const items = []
  try {
    for (let i = 0; i < state.count; i++) {
      const usedSeed = c.supportsSeed ? baseSeed + i : baseSeed
      state.genProgress = state.count > 1 ? `Generating image ${i + 1} of ${state.count}…` : 'Generating…'
      syncUI()
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), 180_000)
      try {
        const src = await generateImageFromApi(
          {
            prompt: state.prompt.trim(),
            model: state.modelId,
            source: state.source,
            ...(c.supportsNegativePrompt && state.negativePrompt.trim()
              ? { negative_prompt: state.negativePrompt.trim() }
              : {}),
            aspect_ratio: state.aspect,
            resolution: state.resolution,
            ...(c.supportsSeed ? { seed: usedSeed } : {}),
            n: 1,
            ...(c.qualityValues.length > 0 ? { quality: state.quality } : {}),
            output_format: state.format,
            width: state.width,
            height: state.height,
          },
          controller.signal
        )
        items.push({
          id: Date.now() + i,
          src,
          prompt: state.prompt.trim(),
          model: state.modelId,
          seed: usedSeed,
          width: state.width,
          height: state.height,
          format: state.format,
          at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      } finally {
        window.clearTimeout(timer)
      }
    }
    state.current = items[0]
    state.history = [...items, ...state.history].slice(0, 12)
    state.status = 'done'
  } catch (err) {
    if (items.length > 0) {
      state.current = items[0]
      state.history = [...items, ...state.history].slice(0, 12)
      state.status = 'done'
      state.genError = `Generated ${items.length} of ${state.count} images, then the API failed.`
    } else {
      state.status = 'error'
      state.genError =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Generation timed out after 180 seconds. Try again or pick a faster model.'
          : err instanceof Error
            ? err.message
            : 'Generation failed. Check that the API server is running.'
    }
  } finally {
    state.genProgress = ''
  }
  // Mobile scroll on completion (mirrors the React useEffect on status).
  const shouldScroll = window.innerWidth < 1024
  syncUI()
  if (shouldScroll) els.previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function resetAll() {
  state.prompt = ''
  state.negativePrompt = ''
  state.aspect = '1:1'
  state.resolution = '1K'
  state.customSize = false
  state.width = 1024
  state.height = 1024
  state.seed = randomSeed()
  state.count = 1
  state.quality = 'auto'
  state.format = 'png'
  state.status = 'idle'
  state.current = null
  state.genError = ''
  els.prompt.value = ''
  els.negative.value = ''
  syncUI()
}

function restore(item) {
  state.current = item
  state.prompt = item.prompt
  els.prompt.value = item.prompt
  changeModel(item.model)
  state.seed = item.seed
  state.randomSeedOn = false
  state.format = item.format
  // History items store exact dimensions, not aspect/resolution.
  // Keep them as a custom size so the preview matches the image.
  state.width = item.width
  state.height = item.height
  state.customSize = true
  state.status = 'done'
  syncUI()
}

let modelsController = null
function loadModels() {
  if (modelsController) modelsController.abort()
  const controller = new AbortController()
  modelsController = controller
  state.modelsStatus = 'loading'
  syncUI()
  fetchTextToImageModels(controller.signal, state.source)
    .then((list) => {
      state.models = list
      state.modelsStatus = 'ready'
      const savedId = typeof saved.modelId === 'string' ? saved.modelId : ''
      const pick =
        list.find((m) => m.id === savedId)?.id ??
        list.find((m) => m.id === DEFAULT_MODEL_ID)?.id ??
        list[0]?.id ??
        ''
      if (pick) changeModel(pick, list)
      saveSettings()
      syncUI()
    })
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      state.modelsStatus = 'error'
      syncUI()
    })
}

// --- Event wiring (mirrors the React onChange/onClick handlers) ---
els.themeToggle.addEventListener('click', () => {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  document.documentElement.classList.toggle('dark', state.theme === 'dark')
  localStorage.setItem('photopik-theme', state.theme)
  syncTheme()
})
els.source.addEventListener('change', (e) => {
  state.source = e.target.value
  state.models = []
  state.modelId = ''
  loadModels()
})
els.model.addEventListener('change', (e) => {
  changeModel(e.target.value)
  saveSettings()
  syncUI()
})
els.modelRetry.addEventListener('click', () => loadModels())
els.prompt.addEventListener('input', (e) => {
  state.prompt = e.target.value
  els.promptHint.textContent = `${state.prompt.length} characters. Be specific about subject, style, and lighting.`
  if (state.promptError) {
    // Keep the error visible until the next Generate attempt, as in React.
  }
  saveSettings()
})
els.negative.addEventListener('input', (e) => {
  state.negativePrompt = e.target.value
})
el('count-minus').addEventListener('click', () => {
  state.count = Math.max(1, state.count - 1)
  syncUI()
})
el('count-plus').addEventListener('click', () => {
  state.count = Math.min(caps().maxImages, state.count + 1)
  syncUI()
})
els.aspect.addEventListener('change', (e) => {
  changeAspect(e.target.value)
  saveSettings()
  syncUI()
})
els.resolution.addEventListener('change', (e) => {
  changeResolution(e.target.value)
  saveSettings()
  syncUI()
})
els.format.addEventListener('change', (e) => {
  state.format = e.target.value
  syncUI()
})
els.seed.addEventListener('input', (e) => {
  state.seed = Number(e.target.value)
})
el('seed-randomize').addEventListener('click', () => {
  state.seed = randomSeed()
  state.randomSeedOn = false
  syncUI()
})
els.seedRandom.addEventListener('change', (e) => {
  state.randomSeedOn = e.target.checked
  syncUI()
})
els.customSize.addEventListener('change', (e) => {
  state.customSize = e.target.checked
  syncUI()
})
els.width.addEventListener('input', (e) => {
  state.width = Math.min(4096, Math.max(256, Number(e.target.value) || 256))
  els.outputSize.textContent = `${state.width} × ${state.height}px`
  els.previewBox.style.aspectRatio = `${state.width} / ${state.height}`
})
els.height.addEventListener('input', (e) => {
  state.height = Math.min(4096, Math.max(256, Number(e.target.value) || 256))
  els.outputSize.textContent = `${state.width} × ${state.height}px`
  els.previewBox.style.aspectRatio = `${state.width} / ${state.height}`
})
els.generate.addEventListener('click', generate)
el('reset').addEventListener('click', resetAll)
els.resultReuseSeed.addEventListener('click', () => {
  if (!state.current) return
  state.seed = state.current.seed
  state.randomSeedOn = false
  syncUI()
})

syncUI()
loadModels()

// --- First-run setup / provider settings ---
function selectSetupChoice(choice) {
  const isLocal = choice === 'local'
  el('setup-openrouter-form').hidden = isLocal
  el('setup-local-form').hidden = !isLocal
  el('setup-choice-openrouter').classList.toggle('active', !isLocal)
  el('setup-choice-local').classList.toggle('active', isLocal)
  el('setup-choice-openrouter').setAttribute('aria-pressed', String(!isLocal))
  el('setup-choice-local').setAttribute('aria-pressed', String(isLocal))
}
el('setup-choice-openrouter')?.addEventListener('click', () => selectSetupChoice('openrouter'))
el('setup-choice-local')?.addEventListener('click', () => selectSetupChoice('local'))
async function pollSetupJob(jobId, done) {
  const tick = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/setup/jobs/${jobId}`)
      const job = await r.json()
      setupMsg(job.message || job.status, job.status === 'failed')
      if (job.status === 'running') window.setTimeout(tick, 2000)
      else if (done) done(job)
    } catch { window.setTimeout(tick, 3000) }
  }
  tick()
}
function setupMsg(text, isError) {
  const m = el('setup-message')
  if (!m) return
  m.hidden = !text
  m.textContent = text || ''
}
async function loadSetup() {
  const panel = el('setup-panel')
  if (!panel) return
  try {
    const r = await fetch(`${API_BASE_URL}/setup/status`)
    const s = await r.json()
    const ready = s.openrouter_configured || s.local.ready
    panel.hidden = ready && s.state === 'ready'
    document.body.style.overflow = panel.hidden ? '' : 'hidden'
    el('setup-status').textContent = s.openrouter_configured
      ? 'OpenRouter is configured. You can generate images.'
      : 'Choose OpenRouter or a local model to start generating.'
    el('setup-local-info').textContent =
      `Dependencies: ${s.local.deps_installed ? 'installed' : 'not installed'} · ` +
      `Models folder: ${s.local.models_dir} · Free disk: ${s.local.disk_free_gb ?? '?'} GB` +
      (s.local.gpu ? ` · GPU: ${s.local.gpu}` : '')
    const box = el('setup-catalog')
    box.innerHTML = ''
    for (const entry of s.local.catalog || []) {
      const downloaded = (s.local.models || []).some((m) => m.id === entry.id)
      const row = document.createElement('div')
      row.className = 'setup-row'
      const label = document.createElement('span')
      label.textContent = `${entry.name} · ~${entry.size_gb} GB · ${entry.license}${entry.gated ? ' · gated' : ''}${downloaded ? ' · downloaded' : ''}`
      row.appendChild(label)
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'btn'
      btn.textContent = downloaded ? 'Delete' : 'Download'
      btn.addEventListener('click', async () => {
        if (downloaded) {
          await fetch(`${API_BASE_URL}/setup/local/models/${encodeURIComponent(entry.id)}`, { method: 'DELETE' })
          loadSetup(); loadModels(); return
        }
        if (!el('setup-consent-license').checked) { setupMsg('Please accept the model license first.', true); return }
        const res = await fetch(`${API_BASE_URL}/setup/local/models/download`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_id: entry.id, accept_license: true }),
        })
        const data = await res.json()
        if (!res.ok) { setupMsg(data.error || 'Download failed', true); return }
        setupMsg('Download started…', false)
        pollSetupJob(data.job_id, () => { state.source = 'local'; loadSetup(); loadModels() })
      })
      row.appendChild(btn)
      box.appendChild(row)
    }
  } catch { panel.hidden = false }
}
el('setup-save-key')?.addEventListener('click', async () => {
  const key = el('setup-api-key').value.trim()
  if (!key) { setupMsg('Paste your OpenRouter API key first.', true); return }
  const r = await fetch(`${API_BASE_URL}/setup/openrouter`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { setupMsg(data.error || 'Could not save key', true); return }
  el('setup-api-key').value = ''
  setupMsg('OpenRouter key saved on the server.', false)
  closeSetup()
  loadSetup(); loadModels()
})
el('setup-install-deps')?.addEventListener('click', async () => {
  if (!el('setup-consent-deps').checked) { setupMsg('Please agree to the dependency download first.', true); return }
  const r = await fetch(`${API_BASE_URL}/setup/local/consent-install`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consent: true }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { setupMsg(data.error || 'Install failed to start', true); return }
  setupMsg('Installing dependencies. This can take a while; restart the app when it finishes.', false)
  pollSetupJob(data.job_id, () => loadSetup())
})
el('setup-download-custom')?.addEventListener('click', async () => {
  const repo = el('setup-custom-model').value.trim()
  if (!repo) { setupMsg('Enter a Hugging Face model ID.', true); return }
  if (!el('setup-consent-license').checked) { setupMsg('Please accept the model license first.', true); return }
  const r = await fetch(`${API_BASE_URL}/setup/local/models/download`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_id: repo, accept_license: true }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { setupMsg(data.error || 'Download failed to start', true); return }
  setupMsg('Download started…', false)
  pollSetupJob(data.job_id, () => { state.source = 'local'; loadSetup(); loadModels() })
})
function closeSetup() {
  el('setup-panel').hidden = true
  document.body.style.overflow = ''
}
loadSetup()


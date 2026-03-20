const SUPABASE_URL = "https://bfkiipxuilltkjrrztmx.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJma2lpcHh1aWxsdGtqcnJ6dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjE2NzUsImV4cCI6MjA4ODY5NzY3NX0.auc6AGduIrb-05947GH8mUysRfIa9zlHiVdPNQso5kU"

// ── Configuração dos mundos ──────────────────────────────────────────────────
const MUNDOS = [
  {
    id: "historia",
    nome: "História",
    emoji: "🏛️",
    cor: "#e07b39",
    corClaro: "#fdf0e6",
    descricao: "Viaje pelo tempo e teste seus conhecimentos históricos!"
  },
  {
    id: "matematica",
    nome: "Matemática",
    emoji: "🔢",
    cor: "#3b82f6",
    corClaro: "#eff6ff",
    descricao: "Números, lógica e raciocínio estão te esperando!"
  },
  {
    id: "geografia",
    nome: "Geografia",
    emoji: "🌍",
    cor: "#22c55e",
    corClaro: "#f0fdf4",
    descricao: "Explore o mundo e descubra os segredos do planeta!"
  },
  {
    id: "portugues",
    nome: "Português",
    emoji: "📖",
    cor: "#a855f7",
    corClaro: "#faf5ff",
    descricao: "Gramática, literatura e a língua portuguesa!"
  },
  {
    id: "ingles",
    nome: "Inglês",
    emoji: "🌐",
    cor: "#ec4899",
    corClaro: "#fdf2f8",
    descricao: "English vocabulary, grammar and more!"
  }
]

const DIFICULDADES = [
  { id: "facil",  nome: "Fácil",  emoji: "🌱", xpMax: 500  },
  { id: "medio",  nome: "Médio",  emoji: "⚡", xpMax: 1000 },
  { id: "dificil",nome: "Difícil",emoji: "🔥", xpMax: 2000 }
]

// ── LocalStorage helpers ─────────────────────────────────────────────────────
const STORAGE_KEY = "quiz_progresso_v1"

function carregarProgresso() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

function salvarProgresso(progresso) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progresso))
}

// Chave: "historia_facil" → { estrelas: 2, xp: 350, concluida: true }
function getFase(mundoId, difId) {
  const prog = carregarProgresso()
  return prog[`${mundoId}_${difId}`] || { estrelas: 0, xp: 0, concluida: false }
}

function isFaseDesbloqueada(mundoId, difIndex) {
  if (difIndex === 0) return true // Fácil sempre desbloqueada
  const difAnterior = DIFICULDADES[difIndex - 1]
  const faseAnterior = getFase(mundoId, difAnterior.id)
  return faseAnterior.concluida
}

function calcularXpTotal() {
  const prog = carregarProgresso()
  return Object.values(prog).reduce((acc, f) => acc + (f.xp || 0), 0)
}

// ── Renderização do mapa ─────────────────────────────────────────────────────
function renderMapa() {
  const container = document.getElementById("mundosContainer")
  container.innerHTML = ""

  document.getElementById("xpTotalGlobal").innerText = calcularXpTotal().toLocaleString("pt-BR")

  MUNDOS.forEach((mundo, mi) => {
    const mundoEl = document.createElement("div")
    mundoEl.className = "mundo-card"
    mundoEl.style.setProperty("--cor-mundo", mundo.cor)
    mundoEl.style.setProperty("--cor-mundo-claro", mundo.corClaro)

    // Calcula progresso do mundo
    const fasesCompletas = DIFICULDADES.filter(d => getFase(mundo.id, d.id).concluida).length
    const totalEstrelas = DIFICULDADES.reduce((acc, d) => acc + getFase(mundo.id, d.id).estrelas, 0)

    mundoEl.innerHTML = `
      <div class="mundo-header">
        <div class="mundo-emoji">${mundo.emoji}</div>
        <div class="mundo-info">
          <h2 class="mundo-nome">${mundo.nome}</h2>
          <p class="mundo-descricao">${mundo.descricao}</p>
        </div>
        <div class="mundo-estrelas-total">
          ${'⭐'.repeat(totalEstrelas)}${'☆'.repeat(9 - totalEstrelas)}
        </div>
      </div>
      <div class="mundo-progresso-bar-wrap">
        <div class="mundo-progresso-bar" style="width:${Math.round((fasesCompletas/3)*100)}%"></div>
      </div>
      <div class="fases-row" id="fases-${mundo.id}"></div>
    `
    container.appendChild(mundoEl)

    const fasesRow = mundoEl.querySelector(`#fases-${mundo.id}`)

    DIFICULDADES.forEach((dif, di) => {
      const fase = getFase(mundo.id, dif.id)
      const desbloqueada = isFaseDesbloqueada(mundo.id, di)

      const faseEl = document.createElement("div")
      faseEl.className = "fase-card " + (
        !desbloqueada ? "fase-bloqueada" :
        fase.concluida ? "fase-concluida" : "fase-disponivel"
      )

      const estrelas = fase.estrelas
      const estrelasHTML = [1,2,3].map(n =>
        `<span class="estrela ${n <= estrelas ? 'on' : ''}">${n <= estrelas ? '⭐' : '☆'}</span>`
      ).join("")

      faseEl.innerHTML = `
        <div class="fase-icon">${desbloqueada ? dif.emoji : '🔒'}</div>
        <div class="fase-nome">${dif.nome}</div>
        <div class="fase-estrelas">${estrelasHTML}</div>
        <div class="fase-xp">${fase.concluida ? fase.xp.toLocaleString('pt-BR') + ' XP' : 'até ' + dif.xpMax.toLocaleString('pt-BR') + ' XP'}</div>
        ${desbloqueada ? `<button class="fase-btn" onclick="iniciarFase('${mundo.id}','${dif.id}')">
          ${fase.concluida ? '🔄 Rejugar' : '▶ Jogar'}
        </button>` : `<div class="fase-lock-msg">Complete a fase anterior</div>`}
      `
      fasesRow.appendChild(faseEl)
    })
  })
}

// ── Iniciar fase ─────────────────────────────────────────────────────────────
function iniciarFase(mundoId, difId) {
  // Salva qual fase vai jogar e redireciona para o jogo
  sessionStorage.setItem("fase_atual", JSON.stringify({ mundoId, difId }))
  window.location.href = "index.html"
}

// ── Reset de progresso ───────────────────────────────────────────────────────
function resetProgress() {
  if (!confirm("Tem certeza que quer apagar todo o progresso?")) return
  localStorage.removeItem(STORAGE_KEY)
  renderMapa()
}

// ── Init ─────────────────────────────────────────────────────────────────────
renderMapa()

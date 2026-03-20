const SUPABASE_URL = "https://bfkiipxuilltkjrrztmx.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJma2lpcHh1aWxsdGtqcnJ6dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjE2NzUsImV4cCI6MjA4ODY5NzY3NX0.auc6AGduIrb-05947GH8mUysRfIa9zlHiVdPNQso5kU"

// ── Fase atual (vinda do mapa) ───────────────────────────────────────────────
let faseAtual = null  // { mundoId, difId }
try {
  const raw = sessionStorage.getItem("fase_atual")
  if (raw) faseAtual = JSON.parse(raw)
} catch {}

// ── Configuração de perguntas por fase ──────────────────────────────────────
const PERGUNTAS_POR_FASE = 5

// XP por pergunta dentro da fase (escala por dificuldade)
const XP_TABLE = {
  facil:   [50,  75,  100, 125, 150],
  medio:   [100, 150, 200, 250, 300],
  dificil: [200, 300, 400, 500, 600]
}

// ── Estado global ────────────────────────────────────────────────────────────
let perguntasJogo = []
let perguntaAtual = 0
let xp = 0
let acertos = 0
let erros = 0
let respondida = false

const ajudas = { eliminar: true, pular: true, dica: true }

// ── Helpers localStorage ─────────────────────────────────────────────────────
const STORAGE_KEY = "quiz_progresso_v1"

function carregarProgresso() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {} } catch { return {} }
}

function salvarFase(mundoId, difId, estrelas, xpGanho) {
  const prog = carregarProgresso()
  const chave = `${mundoId}_${difId}`
  const anterior = prog[chave] || { estrelas: 0, xp: 0, concluida: false }
  prog[chave] = {
    concluida: true,
    estrelas: Math.max(anterior.estrelas, estrelas),  // guarda melhor resultado
    xp: Math.max(anterior.xp, xpGanho)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prog))
}

// ── Calcula estrelas com base no aproveitamento ──────────────────────────────
function calcularEstrelas(acertos, total) {
  const pct = acertos / total
  if (pct === 1)      return 3
  if (pct >= 0.6)     return 2
  if (pct >= 0.4)     return 1
  return 0
}

// ── Fisher-Yates ─────────────────────────────────────────────────────────────
function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// ── Barra de progresso ───────────────────────────────────────────────────────
function updateProgressBar() {
  const total = perguntasJogo.length
  const pct = Math.round((perguntaAtual / total) * 100)
  document.getElementById("progressBar").style.width = pct + "%"
  document.getElementById("progressPct").innerText = pct + "%"
  document.getElementById("progress").innerText = `Pergunta ${perguntaAtual + 1} de ${total}`
}

function bumpCard(id) {
  const card = document.getElementById(id)
  card.classList.remove("bump")
  void card.offsetWidth
  card.classList.add("bump")
}

function updateAjudaBtns() {
  Object.keys(ajudas).forEach(key => {
    const btn = document.getElementById("ajuda-" + key)
    if (!btn) return
    btn.classList.toggle("ajuda-usada", !ajudas[key])
    btn.disabled = !ajudas[key]
  })
}

// ── Atualiza badge de fase no topo ───────────────────────────────────────────
function updateFaseBadge() {
  const badge = document.getElementById("faseBadge")
  if (!badge) return
  if (faseAtual) {
    const mundoNomes = { historia:"História", matematica:"Matemática", geografia:"Geografia", portugues:"Português", ingles:"Inglês" }
    const difNomes   = { facil:"Fácil", medio:"Médio", dificil:"Difícil" }
    badge.style.display = "inline-block"
    badge.innerText = `${mundoNomes[faseAtual.mundoId] || faseAtual.mundoId} · ${difNomes[faseAtual.difId] || faseAtual.difId}`
  } else {
    badge.style.display = "none"
  }
}

// ── Início do jogo ───────────────────────────────────────────────────────────
async function startGame() {
  document.getElementById("startScreen").style.display = "none"
  document.getElementById("gameScreen").style.display = "block"
  document.getElementById("question").innerText = "Carregando perguntas..."
  document.getElementById("answers").innerHTML = ""

  ajudas.eliminar = true
  ajudas.pular = true
  ajudas.dica = true
  updateAjudaBtns()
  updateFaseBadge()

  try {
    // Monta query filtrando por matéria e dificuldade se vier do mapa
    let url = `${SUPABASE_URL}/rest/v1/quiz?select=*`
    if (faseAtual) {
      url += `&materia=eq.${faseAtual.mundoId}&dificuldade=eq.${faseAtual.difId}`
    }

    const response = await fetch(url, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
    })
    if (!response.ok) throw new Error("Erro ao buscar perguntas")

    const data = await response.json()
    const qtd = faseAtual ? PERGUNTAS_POR_FASE : 15

    perguntasJogo = shuffle(data).slice(0, qtd).map(q => ({
      pergunta: q.pergunta,
      resposta: q.resposta,
      opcoes: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d]
    }))

    if (perguntasJogo.length === 0) {
      document.getElementById("question").innerText = "⚠️ Nenhuma pergunta encontrada para esta fase."
      return
    }

    perguntaAtual = 0
    xp = 0
    acertos = 0
    erros = 0
    respondida = false

    document.getElementById("score").innerText = "⭐ XP: 0"
    document.getElementById("countAcertos").innerText = "0"
    document.getElementById("countErros").innerText = "0"

    updateProgressBar()
    loadQuestion()

  } catch (error) {
    document.getElementById("question").innerText = "⚠️ Não foi possível carregar as perguntas. Verifique sua conexão e tente novamente."
    console.error(error)
  }
}

// ── Carrega pergunta ─────────────────────────────────────────────────────────
function loadQuestion() {
  respondida = false
  const q = perguntasJogo[perguntaAtual]

  const questionEl = document.getElementById("question")
  questionEl.innerText = q.pergunta
  questionEl.className = ""

  updateProgressBar()

  // XP desta pergunta
  const difId = faseAtual?.difId || "facil"
  const xpArr = XP_TABLE[difId] || XP_TABLE.facil
  const xpAtual = xpArr[Math.min(perguntaAtual, xpArr.length - 1)]
  document.getElementById("xpPergunta").innerText = "+" + xpAtual + " XP"

  const answers = document.getElementById("answers")
  answers.innerHTML = ""

  document.getElementById("nextBtn").style.display = "none"
  document.getElementById("dicaBox").style.display = "none"
  document.getElementById("dicaBox").innerText = ""

  updateAjudaBtns()

  shuffle(q.opcoes).forEach(opcao => {
    const btn = document.createElement("button")
    btn.innerText = opcao
    btn.onclick = () => checkAnswer(btn, opcao, q.resposta)
    answers.appendChild(btn)
  })
}

// ── Verifica resposta ────────────────────────────────────────────────────────
function checkAnswer(btn, opcao, resposta) {
  if (respondida) return
  respondida = true

  Object.keys(ajudas).forEach(key => {
    const b = document.getElementById("ajuda-" + key)
    if (b) b.disabled = true
  })

  const buttons = document.querySelectorAll("#answers button")
  buttons.forEach(b => b.disabled = true)

  const questionEl = document.getElementById("question")
  const difId = faseAtual?.difId || "facil"
  const xpArr = XP_TABLE[difId] || XP_TABLE.facil
  const xpAtual = xpArr[Math.min(perguntaAtual, xpArr.length - 1)]

  if (opcao === resposta) {
    btn.classList.add("correct")
    questionEl.classList.add("correct-q")
    acertos++
    xp += xpAtual
    document.getElementById("score").innerText = "⭐ XP: " + xp.toLocaleString("pt-BR")
    document.getElementById("countAcertos").innerText = acertos
    showXpFeedback("+" + xpAtual + " XP!")
    bumpCard("cardAcertos")
  } else {
    btn.classList.add("wrong")
    questionEl.classList.add("wrong-q")
    buttons.forEach(b => { if (b.innerText === resposta) b.classList.add("correct") })
    erros++
    document.getElementById("countErros").innerText = erros
    bumpCard("cardErros")
  }

  const nextBtn = document.getElementById("nextBtn")
  const totalPerguntas = perguntasJogo.length
  nextBtn.innerText = perguntaAtual >= totalPerguntas - 1 ? "Ver resultado 🏁" : "Próxima ➜"
  nextBtn.style.display = "block"
}

function showXpFeedback(texto) {
  const el = document.createElement("div")
  el.className = "xp-popup"
  el.innerText = texto
  document.querySelector(".container").appendChild(el)
  setTimeout(() => el.remove(), 1200)
}

// ── Próxima pergunta ─────────────────────────────────────────────────────────
function nextQuestion() {
  perguntaAtual++
  if (perguntaAtual >= perguntasJogo.length) {
    finishGame()
  } else {
    loadQuestion()
  }
}

// ── Ajudas ───────────────────────────────────────────────────────────────────
function usarEliminar() {
  if (!ajudas.eliminar || respondida) return
  ajudas.eliminar = false
  updateAjudaBtns()
  const q = perguntasJogo[perguntaAtual]
  const buttons = Array.from(document.querySelectorAll("#answers button"))
  const errados = buttons.filter(b => b.innerText.trim() !== q.resposta.trim())
  shuffle(errados).slice(0, 2).forEach(b => { b.classList.add("eliminada"); b.disabled = true })
}

function usarPular() {
  if (!ajudas.pular || respondida) return
  ajudas.pular = false
  respondida = true
  document.getElementById("question").classList.add("pulada-q")
  document.querySelectorAll("#answers button").forEach(b => b.disabled = true)
  Object.keys(ajudas).forEach(key => {
    const btn = document.getElementById("ajuda-" + key)
    if (btn) btn.disabled = true
  })
  updateAjudaBtns()
  setTimeout(() => {
    perguntaAtual++
    if (perguntaAtual >= perguntasJogo.length) { finishGame() } else { loadQuestion() }
  }, 900)
}

function usarDica() {
  if (!ajudas.dica || respondida) return
  ajudas.dica = false
  updateAjudaBtns()
  const q = perguntasJogo[perguntaAtual]
  const resposta = q.resposta.trim()
  const iniciais = resposta.split(" ").map(p => p[0].toUpperCase()).join("-")
  const dicaBox = document.getElementById("dicaBox")
  dicaBox.style.display = "block"
  dicaBox.innerText = `💡 A resposta tem ${resposta.length} letra${resposta.length > 1 ? "s" : ""} e começa com: ${iniciais}`
}

// ── Tela final ───────────────────────────────────────────────────────────────
function finishGame() {
  const total = perguntasJogo.length
  document.getElementById("progressBar").style.width = "100%"
  document.getElementById("progressPct").innerText = "100%"
  document.getElementById("gameScreen").style.display = "none"
  document.getElementById("endScreen").style.display = "block"

  document.getElementById("finalAcertos").innerText = acertos
  document.getElementById("finalErros").innerText = erros

  const ajudasRestantes = Object.values(ajudas).filter(v => v).length
  document.getElementById("finalAjudas").innerText = ajudasRestantes

  const estrelas = calcularEstrelas(acertos, total)
  const pct = Math.round((acertos / total) * 100)

  // Salva progresso se veio do mapa
  if (faseAtual) {
    salvarFase(faseAtual.mundoId, faseAtual.difId, estrelas, xp)
  }

  // Exibe estrelas na tela final
  const estrelasEl = document.getElementById("finalEstrelas")
  if (estrelasEl) {
    estrelasEl.innerHTML = [1,2,3].map(n =>
      `<span style="font-size:2rem;opacity:${n <= estrelas ? '1' : '0.25'}">${n <= estrelas ? '⭐' : '☆'}</span>`
    ).join("")
  }

  let emoji, msg, nivel
  if (pct === 100)    { emoji = "🏆"; msg = "Perfeito!";      nivel = "Lendário" }
  else if (pct >= 80) { emoji = "🌟"; msg = "Muito bem!";     nivel = "Especialista" }
  else if (pct >= 60) { emoji = "😊"; msg = "Bom resultado!"; nivel = "Avançado" }
  else if (pct >= 40) { emoji = "🤔"; msg = "Pode melhorar!"; nivel = "Intermediário" }
  else                { emoji = "💪"; msg = "Não desanime!";  nivel = "Iniciante" }

  document.getElementById("finalMessage").innerText = `${emoji} ${msg}`
  document.getElementById("finalXP").innerText = `⭐ ${xp.toLocaleString("pt-BR")} XP`
  document.getElementById("finalNivel").innerText = `Nível: ${nivel}`
  document.getElementById("performanceMsg").innerText = `${pct}% de aproveitamento — ${acertos} de ${total} acertos`

  // Mostra botão de voltar ao mapa só se veio do mapa
  const btnMapa = document.getElementById("btnVoltarMapa")
  if (btnMapa) btnMapa.style.display = faseAtual ? "inline-block" : "none"
}

// ── Reiniciar / Voltar mapa ──────────────────────────────────────────────────
function restartGame() {
  perguntaAtual = 0
  xp = 0
  acertos = 0
  erros = 0
  document.getElementById("endScreen").style.display = "none"
  document.getElementById("startScreen").style.display = "block"
}

function voltarMapa() {
  sessionStorage.removeItem("fase_atual")
  window.location.href = "mapa.html"
}

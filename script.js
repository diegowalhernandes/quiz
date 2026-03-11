const SUPABASE_URL = "https://bfkiipxuilltkjrrztmx.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJma2lpcHh1aWxsdGtqcnJ6dG14Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMjE2NzUsImV4cCI6MjA4ODY5NzY3NX0.auc6AGduIrb-05947GH8mUysRfIa9zlHiVdPNQso5kU"

let perguntasJogo = []
let perguntaAtual = 0
let pontos = 0
let acertos = 0
let erros = 0
let respondida = false

const premios = [100, 200, 300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 750000, 1000000]

function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function updateProgressBar() {
  const pct = Math.round((perguntaAtual / 15) * 100)
  document.getElementById("progressBar").style.width = pct + "%"
  document.getElementById("progressPct").innerText = pct + "%"
  document.getElementById("progress").innerText = "Pergunta " + (perguntaAtual + 1) + " de 15"
}

function bumpCard(id) {
  const card = document.getElementById(id)
  card.classList.remove("bump")
  void card.offsetWidth // force reflow
  card.classList.add("bump")
}

async function startGame() {
  document.getElementById("startScreen").style.display = "none"
  document.getElementById("gameScreen").style.display = "block"
  document.getElementById("question").innerText = "Carregando perguntas..."
  document.getElementById("answers").innerHTML = ""

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz?select=*`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    })

    if (!response.ok) throw new Error("Erro ao buscar perguntas")

    const data = await response.json()

    perguntasJogo = shuffle(data).slice(0, 15).map(q => ({
      pergunta: q.pergunta,
      resposta: q.resposta,
      opcoes: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d]
    }))

    perguntaAtual = 0
    pontos = 0
    acertos = 0
    erros = 0
    respondida = false

    document.getElementById("score").innerText = "Pontos: 0"
    document.getElementById("countAcertos").innerText = "0"
    document.getElementById("countErros").innerText = "0"

    updateProgressBar()
    loadQuestion()

  } catch (error) {
    document.getElementById("question").innerText = "⚠️ Não foi possível carregar as perguntas. Verifique sua conexão e tente novamente."
    console.error(error)
  }
}

function loadQuestion() {
  respondida = false
  const q = perguntasJogo[perguntaAtual]

  const questionEl = document.getElementById("question")
  questionEl.innerText = q.pergunta
  questionEl.className = ""

  updateProgressBar()

  const answers = document.getElementById("answers")
  answers.innerHTML = ""

  const nextBtn = document.getElementById("nextBtn")
  nextBtn.style.display = "none"

  const opcosEmbaralhadas = shuffle(q.opcoes)

  opcosEmbaralhadas.forEach(opcao => {
    const btn = document.createElement("button")
    btn.innerText = opcao
    btn.onclick = () => checkAnswer(btn, opcao, q.resposta)
    answers.appendChild(btn)
  })
}

function checkAnswer(btn, opcao, resposta) {
  if (respondida) return
  respondida = true

  const buttons = document.querySelectorAll("#answers button")
  buttons.forEach(b => b.disabled = true)

  const questionEl = document.getElementById("question")

  if (opcao === resposta) {
    btn.classList.add("correct")
    questionEl.classList.add("correct-q")
    acertos++
    pontos += premios[perguntaAtual]
    document.getElementById("score").innerText = "Pontos: " + pontos.toLocaleString("pt-BR")
    document.getElementById("countAcertos").innerText = acertos
    bumpCard("cardAcertos")
  } else {
    btn.classList.add("wrong")
    questionEl.classList.add("wrong-q")
    buttons.forEach(b => {
      if (b.innerText === resposta) b.classList.add("correct")
    })
    erros++
    document.getElementById("countErros").innerText = erros
    bumpCard("cardErros")
  }

  // Última pergunta: botão vira "Ver resultado"
  const nextBtn = document.getElementById("nextBtn")
  if (perguntaAtual >= 14) {
    nextBtn.innerText = "Ver resultado 🏁"
  } else {
    nextBtn.innerText = "Próxima ➜"
  }
  nextBtn.style.display = "block"
}

function nextQuestion() {
  perguntaAtual++
  if (perguntaAtual >= 15) {
    finishGame()
  } else {
    loadQuestion()
  }
}

function finishGame() {
  // Atualiza barra para 100%
  document.getElementById("progressBar").style.width = "100%"
  document.getElementById("progressPct").innerText = "100%"

  document.getElementById("gameScreen").style.display = "none"
  document.getElementById("endScreen").style.display = "block"

  document.getElementById("finalAcertos").innerText = acertos
  document.getElementById("finalErros").innerText = erros

  const pct = Math.round((acertos / 15) * 100)

  let emoji = ""
  let msg = ""
  let performance = ""

  if (pct === 100) {
    emoji = "🏆"; msg = "Perfeito! Você acertou tudo!"
    performance = "Incrível! Aproveitamento de 100%!"
  } else if (pct >= 80) {
    emoji = "🌟"; msg = "Muito bem!"
    performance = `Aproveitamento de ${pct}% — Excelente!`
  } else if (pct >= 60) {
    emoji = "😊"; msg = "Bom resultado!"
    performance = `Aproveitamento de ${pct}% — Continue assim!`
  } else if (pct >= 40) {
    emoji = "🤔"; msg = "Pode melhorar!"
    performance = `Aproveitamento de ${pct}% — Tente novamente!`
  } else {
    emoji = "💪"; msg = "Não desanime!"
    performance = `Aproveitamento de ${pct}% — A prática leva à perfeição!`
  }

  document.getElementById("finalMessage").innerText = emoji + " " + msg
  document.getElementById("finalScore").innerText = "Pontuação: " + pontos.toLocaleString("pt-BR")
  document.getElementById("performanceMsg").innerText = performance
}

function restartGame() {
  perguntaAtual = 0
  pontos = 0
  acertos = 0
  erros = 0
  document.getElementById("endScreen").style.display = "none"
  document.getElementById("startScreen").style.display = "block"
}
# 🎮 Quiz do Conhecimento

Um jogo de quiz estilo "Show do Milhão" com perguntas carregadas do Supabase, sistema de pontuação progressiva, placar de acertos e erros em tempo real, e barra de progresso animada.

---

## 📌 Funcionalidades

- 15 perguntas sorteadas aleatoriamente a cada partida
- O jogador **avança mesmo ao errar** — sem game over antecipado
- **Placar em tempo real** com contadores individuais de acertos e erros
- **Barra de progresso animada** com percentual de conclusão
- Feedback visual imediato: resposta correta destacada em verde, errada em vermelho
- **Tela de resultado final** com resumo de desempenho e mensagem personalizada por aproveitamento
- Perguntas e opções embaralhadas a cada rodada (algoritmo Fisher-Yates)
- Interface responsiva para mobile e desktop

---

## 🗂️ Estrutura do Projeto

```
quiz-do-conhecimento/
├── index.html     # Estrutura das telas (início, jogo, resultado)
├── style.css      # Estilos, animações e responsividade
└── script.js      # Lógica do jogo, integração com Supabase
```

> O projeto também está disponível em versão **single-file** (`index.html` com CSS e JS embutidos).

---

## 🗄️ Banco de Dados (Supabase)

As perguntas são buscadas em tempo real de uma tabela no [Supabase](https://supabase.com).

### Estrutura da tabela `quiz`

| Coluna        | Tipo    | Descrição                          |
|---------------|---------|------------------------------------|
| `id`          | integer | Identificador único                |
| `pergunta`    | text    | Enunciado da pergunta              |
| `opcao_a`     | text    | Alternativa A                      |
| `opcao_b`     | text    | Alternativa B                      |
| `opcao_c`     | text    | Alternativa C                      |
| `opcao_d`     | text    | Alternativa D                      |
| `resposta`    | text    | Texto exato da alternativa correta |
| `dificuldade` | text    | `"facil"`, `"medio"` ou `"dificil"` |

> O campo `resposta` deve conter o **texto completo** de uma das quatro opções, não uma letra (ex.: `"Paris"` e não `"A"`).

---

## 🚀 Como Rodar

Por ser um projeto puramente front-end (HTML + CSS + JS), basta abrir o arquivo no navegador:

```bash
# Opção 1 — abrir direto
open index.html

# Opção 2 — servidor local (recomendado para evitar CORS)
npx serve .
# ou
python -m http.server 8080
```

Acesse `http://localhost:8080` no navegador.

---

## ⚙️ Configuração

As credenciais do Supabase ficam no topo de `script.js`:

```js
const SUPABASE_URL = "https://<seu-projeto>.supabase.co"
const SUPABASE_KEY = "<sua-anon-key>"
```

Substitua pelos valores do seu projeto em **Supabase → Settings → API**.

---

## 🏆 Sistema de Pontuação

A pontuação segue a tabela de prêmios abaixo. Cada acerto vale o prêmio correspondente à posição da pergunta — erros não subtraem pontos.

| Pergunta | Prêmio (R$)   |
|----------|---------------|
| 1        | 100           |
| 2        | 200           |
| 3        | 300           |
| 4        | 500           |
| 5        | 1.000         |
| 6        | 2.000         |
| 7        | 5.000         |
| 8        | 10.000        |
| 9        | 20.000        |
| 10       | 50.000        |
| 11       | 100.000       |
| 12       | 200.000       |
| 13       | 500.000       |
| 14       | 750.000       |
| 15       | 1.000.000     |

---

## 🛠️ Tecnologias

- **HTML5 / CSS3 / JavaScript** (vanilla, sem frameworks)
- **Supabase** — banco de dados e API REST
- **Google Fonts** — Fredoka One + Nunito

---

## 📄 Licença

Este projeto é de uso livre para fins educacionais e pessoais.

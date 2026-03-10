let perguntasData
let perguntasJogo=[]
let perguntaAtual=0
let pontos=0

const premios=[100,200,300,500,1000,2000,5000,10000,20000,50000,100000,200000,500000,750000,1000000]

async function startGame(){

const response = await fetch("data.json")
perguntasData = await response.json()

perguntasJogo=[
...shuffle(perguntasData.facil),
...shuffle(perguntasData.medio),
...shuffle(perguntasData.dificil)
].slice(0,15)

document.getElementById("startScreen").style.display="none"
document.getElementById("gameScreen").style.display="block"

loadQuestion()

}

function shuffle(array){
return array.sort(()=>Math.random()-0.5)
}

function loadQuestion(){

const q=perguntasJogo[perguntaAtual]

document.getElementById("question").innerText=q.pergunta
document.getElementById("progress").innerText="Pergunta "+(perguntaAtual+1)+" de 15"

const answers=document.getElementById("answers")
answers.innerHTML=""

q.opcoes.forEach(opcao=>{

const btn=document.createElement("button")
btn.innerText=opcao

btn.onclick=()=>checkAnswer(btn,opcao,q.resposta)

answers.appendChild(btn)

})

}

function checkAnswer(btn,opcao,resposta){

const buttons=document.querySelectorAll("#answers button")

buttons.forEach(b=>b.disabled=true)

if(opcao===resposta){

btn.classList.add("correct")

pontos=premios[perguntaAtual]
document.getElementById("score").innerText="Pontos: "+pontos

setTimeout(()=>{
perguntaAtual++

if(perguntaAtual>=15){
winGame()
}else{
loadQuestion()
}

},800)

}else{

btn.classList.add("wrong")

buttons.forEach(b=>{
if(b.innerText===resposta){
b.classList.add("correct")
}
})

setTimeout(endGame,1200)

}

}

function winGame(){

document.getElementById("gameScreen").style.display="none"
document.getElementById("endScreen").style.display="block"

document.getElementById("finalMessage").innerText="🏆 Você ganhou 1 milhão!"
document.getElementById("finalScore").innerText="Pontuação: "+pontos

}

function endGame(){

document.getElementById("gameScreen").style.display="none"
document.getElementById("endScreen").style.display="block"

document.getElementById("finalMessage").innerText="❌ Fim de jogo"
document.getElementById("finalScore").innerText="Você ganhou: "+pontos

}

function restartGame(){

perguntaAtual=0
pontos=0

document.getElementById("endScreen").style.display="none"
document.getElementById("startScreen").style.display="block"

}

function loadQuestion() {
  const q = perguntasJogo[perguntaAtual];

  document.getElementById("question").innerText = q.pergunta;
  document.getElementById("progress").innerText = "Pergunta " + (perguntaAtual + 1) + " de 15";

  const answers = document.getElementById("answers");
  answers.innerHTML = "";

  // ✅ Embaralha uma cópia das opções sem modificar o original
  const opcosEmbaralhadas = shuffle([...q.opcoes]);

  opcosEmbaralhadas.forEach(opcao => {
    const btn = document.createElement("button");
    btn.innerText = opcao;
    btn.onclick = () => checkAnswer(btn, opcao, q.resposta);
    answers.appendChild(btn);
  });
}
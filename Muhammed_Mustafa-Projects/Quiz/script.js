import {questions} from "./questions.js";

const questionText = document.getElementById("questionText");
const reply1 = document.getElementById("reply1");
const reply2 = document.getElementById("reply2");
const resultText = document.getElementById("resultText");
const correctCountText = document.getElementById("correctCount");
const wrongCountText = document.getElementById("wrongCount");

let questionNumber = 0;
let correctCount = 0;
let wrongCount = 0;

function SetupQuestion() {
    let question = questions[questionNumber];

    questionText.textContent = question.question;

    let randomIndex1 = Math.floor(Math.random() * 2);
    let randomIndex2 = Math.floor(Math.random() * 2);

    if (randomIndex1 == randomIndex2) {
        randomIndex2 = Math.floor(Math.random() * 2);
    }

    reply1.textContent = question.options[randomIndex1];
    reply2.textContent = question.options[randomIndex2];
    resultText.textContent = "";

    reply1.onclick = function() {CheckAnswer(reply1.textContent, question.answer)};
    reply2.onclick = function() {CheckAnswer(reply2.textContent, question.answer)};
}

function CheckAnswer(reply, correctAnswer) {
    if (reply == correctAnswer) {
        resultText.textContent = "Doğru Cevap";
        correctCount += 1;
        correctCountText.textContent = "Doğru: " + correctCount;
    } else {
        resultText.textContent = "Yanlış Cevap";
        wrongCount += 1;
        wrongCountText.textContent = "Yanlış: " + wrongCount;
    }

    questionNumber += 1;

    if (questionNumber < questions.length) {
        setTimeout(SetupQuestion, 1000);
    } else {
        resultText.textContent = "Quiz Bitti";
    }
}

SetupQuestion();
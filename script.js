let currentQuestion = 0;
let answers = [];

// Temporary placeholder questions
let questions = [
  { id: 1, text: "I enjoy solving science or math problems." },
  { id: 2, text: "I prefer working in groups over working alone." },
  { id: 3, text: "I like designing or creating new things." }
];

document.getElementById("startBtn").addEventListener("click", () => {
  document.getElementById("welcome-screen").classList.add("d-none");
  document.getElementById("question-screen").classList.remove("d-none");
  showQuestion();
});

document.getElementById("nextBtn").addEventListener("click", () => {
  if (currentQuestion < questions.length - 1) {
    currentQuestion++;
    showQuestion();
    document.getElementById("prevBtn").disabled = false;
  } else {
    showResults();
  }
});

document.getElementById("prevBtn").addEventListener("click", () => {
  if (currentQuestion > 0) {
    currentQuestion--;
    showQuestion();
    document.getElementById("prevBtn").disabled = currentQuestion === 0;
  }
});

function showQuestion() {
  let q = questions[currentQuestion];
  document.getElementById("question-text").innerText = `${currentQuestion + 1}. ${q.text}`;
  document.getElementById("options").innerHTML = [1, 2, 3, 4, 5].map(v =>
    `<button class="btn btn-outline-primary" onclick="selectAnswer(${q.id}, ${v})">${v}</button>`
  ).join("");

  let progress = ((currentQuestion + 1) / questions.length) * 100;
  document.getElementById("progress-bar").style.width = progress + "%";
  document.getElementById("progress-bar").innerText = Math.round(progress) + "%";

  document.getElementById("nextBtn").innerText = currentQuestion === questions.length - 1 ? "Finish" : "Next";
}

function selectAnswer(id, value) {
  answers[id] = value;
  document.getElementById("nextBtn").disabled = false;
}

function showResults() {
  document.getElementById("question-screen").classList.add("d-none");
  document.getElementById("result-screen").classList.remove("d-none");

  // Placeholder result (later replaced with real scoring)
  document.getElementById("result-content").innerHTML = `
    <div class="alert alert-info">
      <h5>Summary</h5>
      <p>You enjoy problem-solving, teamwork, and creativity.</p>
      <h5>Suggested Majors</h5>
      <ul>
        <li>Computer Science (AI, Data Science)</li>
        <li>Architecture (Sustainable Design)</li>
        <li>Psychology (Counseling)</li>
      </ul>
    </div>
  `;
}

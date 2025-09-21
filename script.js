document.addEventListener("DOMContentLoaded", async () => {
  // Global variables
  let currentQuestionIndex = 0;
  let userAnswers = {}; // Using an object for easier answer mapping
  let questions = [];

  // DOM Elements
  const startBtn = document.getElementById("startBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const welcomeScreen = document.getElementById("welcome-screen");
  const questionScreen = document.getElementById("question-screen");
  const resultScreen = document.getElementById("result-screen");
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options");
  const progressBar = document.getElementById("progress-bar");
  const resultContent = document.getElementById("result-content");

  // Fetch questions from JSON file
  async function loadQuestions() {
    try {
      const response = await fetch('questions.json');
      if (!response.ok) throw new Error('Failed to load questions');
      questions = await response.json();
    } catch (error) {
      console.error(error);
      questionText.innerText = "Gagal memuat pertanyaan. Silakan coba lagi nanti.";
    }
  }

  // --- Event Listeners ---
  startBtn.addEventListener("click", startTest);
  nextBtn.addEventListener("click", nextQuestion);
  prevBtn.addEventListener("click", prevQuestion);

  // --- Core Functions ---
  async function startTest() {
    await loadQuestions();
    if (questions.length > 0) {
      welcomeScreen.classList.add("d-none");
      questionScreen.classList.remove("d-none");
      showQuestion();
    }
  }

  function showQuestion() {
    const q = questions[currentQuestionIndex];
    questionText.innerText = `${currentQuestionIndex + 1}. ${q.text}`;

    // Options: 1 (Sangat Tidak Setuju) to 5 (Sangat Setuju)
    optionsContainer.innerHTML = [1, 2, 3, 4, 5].map(v =>
      `<button class="btn ${userAnswers[q.id] === v ? 'btn-primary' : 'btn-outline-primary'}" onclick="selectAnswer(${q.id}, ${v})">${v}</button>`
    ).join("");
    
    updateNavigation();
    updateProgressBar();
  }

  window.selectAnswer = (questionId, value) => {
    userAnswers[questionId] = value;
    showQuestion(); // Re-render to show selection
    nextBtn.disabled = false;
  };

  function nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      showQuestion();
    } else {
      showResults();
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      showQuestion();
    }
  }
  
  function updateNavigation() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = !userAnswers[questions[currentQuestionIndex].id];
    nextBtn.innerText = currentQuestionIndex === questions.length - 1 ? "Selesai" : "Berikutnya";
  }

  function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.innerText = `${Math.round(progress)}%`;
  }

  // --- Results Calculation and Display ---
  async function showResults() {
    questionScreen.classList.add("d-none");
    resultScreen.classList.remove("d-none");
    resultContent.innerHTML = `<p class="text-center">Menganalisis hasil...</p>`;

    const mbtiType = calculateMbtiType();
    const riasecCode = calculateRiasecCode();

    try {
      const recommendations = await fetch('recommendations.json').then(res => res.json());
      const profile = recommendations.find(p => p.mbti_type === mbtiType && p.riasec_code === riasecCode);

      if (profile) {
        resultContent.innerHTML = `
          <div class="alert alert-success">
            <h5>${profile.display_name} (${profile.mbti_type} / ${profile.riasec_code})</h5>
            <p>${profile.description}</p>
          </div>
          <h5>Rekomendasi Jurusan</h5>
          <ul>
            ${profile.recommendations.majors.map(major => `<li>${major}</li>`).join('')}
          </ul>
          <h5>Rekomendasi Profesi</h5>
          <ul>
            ${profile.recommendations.professions.map(prof => `<li>${prof}</li>`).join('')}
          </ul>
        `;
      } else {
        resultContent.innerHTML = `
          <div class="alert alert-warning">
            <h5>Hasil Tidak Ditemukan</h5>
            <p>Maaf, tidak ada rekomendasi yang cocok untuk kombinasi hasil Anda (${mbtiType} / ${riasecCode}).</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      resultContent.innerHTML = `<div class="alert alert-danger">Gagal memuat data rekomendasi.</div>`;
    }
  }

  function calculateMbtiType() {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, P: 0, J: 0 };
    
    questions.filter(q => q.type === 'mbti').forEach(q => {
      const answerValue = userAnswers[q.id];
      // Jawaban > 3 condong ke sifat 'positive_for'
      if (answerValue > 3) {
        scores[q.positive_for] += (answerValue - 3);
      } 
      // Jawaban < 3 condong ke sifat kebalikannya
      else if (answerValue < 3) {
        const opposite = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', P: 'J', J: 'P' };
        scores[opposite[q.positive_for]] += (3 - answerValue);
      }
    });

    let result = "";
    result += scores.E >= scores.I ? 'E' : 'I';
    result += scores.S >= scores.N ? 'S' : 'N';
    result += scores.T >= scores.F ? 'T' : 'F';
    result += scores.P >= scores.J ? 'P' : 'J';
    return result;
  }

  function calculateRiasecCode() {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    
    questions.filter(q => q.type === 'riasec').forEach(q => {
        // Asumsi jawaban 1-5 menunjukkan tingkat kesetujuan
        scores[q.dimension] += userAnswers[q.id] || 0;
    });

    // Urutkan skor dari tertinggi ke terendah dan ambil 3 huruf pertama
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([key]) => key)
      .join('');
  }
});

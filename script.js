document.addEventListener("DOMContentLoaded", () => {
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
      if (!response.ok) throw new Error('Gagal memuat pertanyaan');
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
    nextBtn.innerText = currentQuestionIndex === questions.length - 1 ? "Lihat Hasil!" : "Lanjut";
  }

  function updateProgressBar() {
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.innerText = `${Math.round(progress)}%`;
  }

  // --- Results Calculation and Display ---

  function calculateMbtiScores() {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, P: 0, J: 0 };
    questions.filter(q => q.type === 'mbti').forEach(q => {
      const answerValue = userAnswers[q.id];
      if (answerValue > 3) {
        scores[q.positive_for] += (answerValue - 3);
      } else if (answerValue < 3) {
        const opposite = { E: 'I', I: 'E', S: 'N', N: 'S', T: 'F', F: 'T', P: 'J', J: 'P' };
        scores[opposite[q.positive_for]] += (3 - answerValue);
      }
    });
    const type = (scores.E >= scores.I ? 'E' : 'I') + (scores.S >= scores.N ? 'S' : 'N') + (scores.T >= scores.F ? 'T' : 'F') + (scores.P >= scores.J ? 'P' : 'J');
    return { type, scores };
  }

  function calculateRiasecScores() {
    const scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    questions.filter(q => q.type === 'riasec').forEach(q => {
      scores[q.dimension] += userAnswers[q.id] || 0;
    });
    const code = Object.entries(scores).sort(([, a], [, b]) => b - a).slice(0, 2).map(([key]) => key).join('');
    return { code, scores };
  }

  async function showResults() {
    questionScreen.classList.add("d-none");
    resultScreen.classList.remove("d-none");
    resultContent.innerHTML = `<p class="text-center">Lagi ngitung hasil akhir kamu, sabar ya...</p>`;

    const mbtiResult = calculateMbtiScores();
    const riasecResult = calculateRiasecScores();
    const analytics = { mbti: mbtiResult.scores, riasec: riasecResult.scores };

    try {
      const recommendations = await fetch('recommendations.json').then(res => res.json());
      const profile = recommendations.find(p => p.mbti_type === mbtiResult.type && p.riasec_code === riasecResult.code);
      displayDetailedResults(profile, analytics, mbtiResult.type, riasecResult.code);
    } catch (error) {
      console.error('Gagal mengambil data rekomendasi:', error);
      resultContent.innerHTML = `<div class="alert alert-danger">Waduh, gagal memuat data rekomendasi nih. Coba lagi nanti ya.</div>`;
    }
  }

  function displayDetailedResults(profile, analytics, mbtiType, riasecCode) {
    if (!profile) {
      resultContent.innerHTML = `<div class="alert alert-warning"><h5>Profil Nggak Ditemukan :(</h5><p>Duh, kayaknya belum ada rekomendasi yang pas banget buat kombinasi hasilmu (${mbtiType} / ${riasecCode}).</p></div>`;
      return;
    }

    const createBox = (title, items, headerBg = 'bg-primary') => `
      <div class="card mb-4 shadow-sm"><div class="card-header ${headerBg} text-white"><h5 class="mb-0">${title}</h5></div><ul class="list-group list-group-flush">${items.map(item => `<li class="list-group-item">${item}</li>`).join('')}</ul></div>`;
    
    const createReasonBox = (title, items) => `
      <div class="card mb-4 shadow-sm"><div class="card-header bg-success text-white"><h5 class="mb-0">${title}</h5></div><div class="list-group list-group-flush">${items.map(item => `<div class="list-group-item"><h6 class="mb-1">${item.name}</h6><small class="text-muted">${item.reason}</small></div>`).join('')}</div></div>`;

    const createAnalyticsBars = (title, scores) => {
        let bars = '';
        const scoreEntries = Object.entries(scores);
        const maxScore = Math.max(...scoreEntries.map(s => s[1]));
        for(const [key, value] of scoreEntries) {
            const percentage = maxScore > 0 ? (value / maxScore) * 100 : 0;
            bars += `<div class="mb-2"><div class="d-flex justify-content-between"><span>${key}</span><span class="fw-bold">${value}</span></div><div class="progress" style="height: 20px;"><div class="progress-bar bg-info" role="progressbar" style="width: ${percentage}%"></div></div></div>`;
        }
        return `<div class="card mb-4 shadow-sm"><div class="card-header bg-secondary text-white"><h5 class="mb-0">${title}</h5></div><div class="card-body">${bars}</div></div>`;
    }

    resultContent.innerHTML = `
      <div class="text-center mb-4"><h2>${profile.profile_title}</h2><p class="lead text-muted">${profile.mbti_type} / ${profile.riasec_code} - ${profile.profile_tagline}</p></div>
      <div class="row"><div class="col-md-12">${createBox("🧐 Kenapa Hasilmu Kayak Gini?", [profile.reason_why], 'bg-dark')}${createBox("✨ Terus, Ini Artinya Apa Buat Kamu?", [profile.what_this_means])}</div></div>
      <div class="row"><div class="col-md-6">${createBox("💪 Kekuatanmu", profile.strengths)}</div><div class="col-md-6">${createBox("🤔 Potensi Kelemahanmu", profile.weaknesses)}</div></div>
      <div class="row"><div class="col-md-12">${createReasonBox("🎓 Rekomendasi Jurusan Kuliah", profile.recommended_majors)}${createReasonBox("💼 Rekomendasi Karir", profile.career_recommendations)}</div></div>
      <div class="row"><div class="col-md-12"><h4 class="mt-4 text-center">📊 Analisis Jawaban Kamu</h4></div><div class="col-md-6">${createAnalyticsBars("Skor RIASEC Kamu", analytics.riasec)}</div><div class="col-md-6">${createAnalyticsBars("Preferensi MBTI Kamu", analytics.mbti)}</div></div>
    `;
  }
});

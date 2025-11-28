// js/game-animal.js

document.addEventListener('start-animal', () => {
    // --- Questions ---
    // NOTE: Make sure you have these images in a folder (e.g., /img/lion.jpg)
    const questions = [
      { img: "static/img/lion.jpg", answer: "lion" },
      { img: "static/img/rhino.jpg", answer: "rhino" },
      { img: "static/img/camel.jpg", answer: "camel" },
    ];
    let current = 0;
    let score = 0;

    // --- DOM Elements ---
    const quizImg = document.getElementById('animal-quiz-img');
    const quizLabel = document.getElementById('animal-quiz-label');
    const startBtn = document.getElementById('animal-quiz-btn');
    const feedbackEl = document.getElementById('animal-quiz-feedback');

    // --- Speech Recognition ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        feedbackEl.textContent = `You said: "${transcript}"`;

        if (transcript.includes(questions[current].answer)) {
            feedbackEl.innerHTML += `<br><span class="text-emerald-400 font-bold">✅ Correct!</span>`;
            score++;
        } else {
            feedbackEl.innerHTML += `<br><span class="text-rose-400 font-bold">❌ Incorrect.</span>`;
        }
        setTimeout(nextQuestion, 1500);
    };

    recognition.onend = function() {
        startBtn.disabled = false;
    };
    
    startBtn.onclick = function() {
        startBtn.disabled = true;
        feedbackEl.textContent = 'Listening...';
        recognition.start();
    };

    // --- Game Flow ---
    function showQuestion() {
        quizImg.src = questions[current].img;
        quizLabel.textContent = `Question ${current + 1} of ${questions.length}`;
        feedbackEl.textContent = '';
        startBtn.disabled = false;
    }

    function nextQuestion() {
        current++;
        if (current < questions.length) {
            showQuestion();
        } else {
            // Game is over
            feedbackEl.textContent = 'Quiz Complete!';
            document.dispatchEvent(new CustomEvent('gamecomplete', {
                detail: {
                    testName: 'animal',
                    score: score,
                    maxScore: questions.length
                }
            }));
        }
    }

    // --- Initialize ---
    showQuestion();
});
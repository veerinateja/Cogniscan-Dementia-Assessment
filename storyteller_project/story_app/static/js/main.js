document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element References ---
    const views = document.querySelectorAll('.view');
    // Phase 0: Start Screen (New)
    const nameInput = document.getElementById('name-input');
    const ageInput = document.getElementById('age-input');
    const educationYesBtn = document.getElementById('education-yes-btn');
    const educationNoBtn = document.getElementById('education-no-btn');
    const educationStatus = document.getElementById('education-status');
    const startStoryButton = document.getElementById('start-story-button');
    
    // Phase 1: Storytelling
    const recordButton = document.getElementById('recordButton');
    const buttonText = document.getElementById('buttonText');
    const micIcon = document.getElementById('micIcon');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const storyTextElement = document.getElementById('storyText');
    const transitionArea = document.getElementById('transitionArea');
    const startGamesButton = document.getElementById('startGamesButton');
    
    // Phase 2: Games
    const gameTitle = document.getElementById('game-title');
    const gameContainers = document.querySelectorAll('.game-container');
    
    // Phase 3: Quiz
    const questionsList = document.getElementById('questionsList');
    const quizCompletion = document.getElementById('quizCompletion');
    const showResultsButton = document.getElementById('showResultsButton');
    
    // Phase 4: Results
    const finalTotalScoreEl = document.getElementById('final-total-score');
    const finalMaxScoreEl = document.getElementById('final-max-score'); // New element for max score
    const scoreBreakdownList = document.getElementById('score-breakdown-list');
    const riskLevelDisplay = document.getElementById('risk-level-display');
    const resultUserName = document.getElementById('result-user-name');
    const startOverButton = document.getElementById('start-over-button');
    const printButton = document.getElementById('print-results-button'); // New Print Button

    // Theme Switcher
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIndicator = document.getElementById('theme-indicator');

    // --- App State ---
    let originalStory = '';
    let generatedQuestions = [];
    let isRecording = false;
    let mediaRecorder;
    let audioChunks = [];
    
    const appState = {
        // User Metrics for MoCA Standards
        userName: '',
        age: null,
        educationBonus: null, // Initialized to null to track selection
        
        // Game Flow State
        currentTestIndex: 0,
        testSequence: ['animal', 'sequence', 'dots', 'memory'],
        rawGameScores: {},
        
        // Quiz Scoring State
        questionsAnswered: 0,
        questionsTotal: 0,
        quizScore: 0.0, // Score based on consistency (max 12 points: 3 questions * 4 pts/q)
        
        // Final Score State
        finalScores: {
            storyRecall: 0.0,
            trailConnecting: 0.0,
            cardGame: 0.0,
            digitSpan: 0.0,
            namingAnimals: 0.0
        }
    };


    // --- View Management ---
    function showView(viewId) {
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(viewId).classList.remove('hidden');
    }

    // --- Utility Functions ---
    function showAlert(message, isError = true) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white p-6 rounded-xl shadow-lg w-full max-w-sm text-center border-t-4 ${isError ? 'border-red-500' : 'border-emerald-500'} text-gray-800">
                <p class="font-semibold mb-4">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="bg-indigo-600 text-white py-2 px-4 rounded-full hover:bg-indigo-700 transition-colors">OK</button>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // --- Phase 0: Start Screen Logic ---
    function updateEducationSelection(selectedBtn) {
        // Reset styles
        educationYesBtn.classList.remove('btn-primary');
        educationYesBtn.classList.add('btn-secondary');
        educationNoBtn.classList.remove('btn-primary');
        educationNoBtn.classList.add('btn-secondary');
        
        // Apply styles and update state based on user requirement (No = 1 point)
        if (selectedBtn === educationNoBtn) {
            // User selected 'No, less than 12 years' -> Apply 1 bonus point
            educationNoBtn.classList.add('btn-primary');
            educationNoBtn.classList.remove('btn-secondary');
            appState.educationBonus = 1.0;
            educationStatus.textContent = 'Selected: Less than 12 years (1 bonus point added to final score).';
        } else if (selectedBtn === educationYesBtn) {
            // User selected 'Yes, 12+ years' -> No bonus point
            educationYesBtn.classList.add('btn-primary');
            educationYesBtn.classList.remove('btn-secondary');
            appState.educationBonus = 0.0;
            educationStatus.textContent = 'Selected: 12+ years of education (0 bonus points).';
        }
        
        checkStartButton();
    }

    function checkStartButton() {
        const name = nameInput.value.trim();
        const age = parseInt(ageInput.value, 10);
        const isNameValid = name.length > 0;
        const isAgeValid = age >= 18 && age <= 120;
        const isEducationSelected = appState.educationBonus !== null;

        if (isNameValid && isAgeValid && isEducationSelected) {
            appState.userName = name;
            appState.age = age;
            startStoryButton.disabled = false;
        } else {
            startStoryButton.disabled = true;
        }
    }


    // --- Phase 1: Storytelling Logic ---
    async function startRecording() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            return showAlert('Your browser does not support microphone access.');
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            
            audioChunks = [];
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await sendAudioToDjango(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            buttonText.textContent = 'Stop Recording';
            micIcon.classList.add('animate-pulse');
            recordButton.classList.remove('bg-indigo-600');
            recordButton.classList.add('bg-red-600');
            storyTextElement.textContent = 'Recording...';
            transitionArea.classList.add('hidden'); 
        } catch (err) {
            console.error('Error accessing microphone:', err);
            showAlert('Failed to access microphone. Please check your permissions.');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            isRecording = false;
            buttonText.textContent = 'Start Recording';
            micIcon.classList.remove('animate-pulse');
            recordButton.classList.remove('bg-red-600');
            recordButton.classList.add('bg-indigo-600');
            storyTextElement.textContent = 'Processing...';
        }
    }

    async function sendAudioToDjango(audioBlob) {
        loadingIndicator.classList.remove('hidden');

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result.split(',')[1];
            const djangoApiUrl = '/api/process-audio/';

            try {
                const response = await fetch(djangoApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ audio_data: base64Audio })
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Server Error:", response.status, errorText);
                    throw new Error(errorText || 'Django server error');
                }

                const data = await response.json();
                originalStory = data.story;
                generatedQuestions = data.questions; 
                appState.questionsTotal = generatedQuestions.length;
                storyTextElement.textContent = originalStory || 'Transcription failed. Story is too short or unclear.';
                
                if (data.questions && data.questions.length > 0) {
                    transitionArea.classList.remove('hidden');
                } else {
                    showAlert('Could not generate meaningful questions from the story. Try recording a longer story.', false);
                }

            } catch (error) {
                console.error("Error processing audio on backend:", error);
                showAlert('Failed to process story on the server. Please check console for API key errors.');
            } finally {
                loadingIndicator.classList.add('hidden');
            }
        };
    }

    // --- Phase 2: Game Flow Logic ---
    function runNextTest() {
        if (appState.currentTestIndex >= appState.testSequence.length) {
            // All games complete, move to Phase 3 (Quiz)
            showView('view-quiz');
            renderQuizQuestions();
            return;
        }

        const nextTestName = appState.testSequence[appState.currentTestIndex];
        showView('view-game');
        
        gameContainers.forEach(gc => gc.classList.add('hidden'));
        document.getElementById(`game-${nextTestName}-container`).classList.remove('hidden');
        
        gameTitle.textContent = `Cognitive Game ${appState.currentTestIndex + 1} of ${appState.testSequence.length}`;
        
        // Dispatch custom event to start the specific game's logic (in game-*.js)
        document.dispatchEvent(new CustomEvent(`start-${nextTestName}`));
    }
    
    // Event listener attached by game-*.js when a game is finished
    document.addEventListener('gamecomplete', (event) => { 
        const { testName, ...metrics } = event.detail; 
        appState.rawGameScores[testName] = metrics; 
        appState.currentTestIndex++; 
        setTimeout(runNextTest, 1500); // 1.5s delay before next test
    });


    // --- Phase 3: Quiz (Question & Verification) Logic ---

    function renderQuizQuestions() {
        // Reset quiz scores for a fresh start (important if user restarts)
        appState.quizScore = 0.0; 
        appState.questionsAnswered = 0;

        questionsList.innerHTML = '';
        if (generatedQuestions.length === 0) {
            questionsList.innerHTML = '<p class="text-lg text-rose-400">No questions were generated earlier. Please record a story again.</p>';
            return;
        }
        
        generatedQuestions.forEach((q, index) => {
            const questionGroup = document.createElement('div');
            questionGroup.id = `q-group-${index}`;
            questionGroup.className = 'p-4 border border-emerald-500/50 bg-slate-700/50 rounded-lg shadow-sm';
            questionGroup.innerHTML = `
                <p class="font-semibold text-emerald-300">${index + 1}. ${q}</p>
                <div class="mt-3 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                    <input type="text" id="answer-input-${index}" class="flex-grow p-2 border border-slate-600 rounded-lg text-white bg-slate-800 focus:ring-2 focus:ring-emerald-400" placeholder="Your answer...">
                    <button id="check-btn-${index}" class="btn-primary shrink-0">Check Answer</button>
                </div>
                <div id="result-${index}"></div>
            `;

            questionsList.appendChild(questionGroup);

            document.getElementById(`check-btn-${index}`).addEventListener('click', () => {
                const answer = document.getElementById(`answer-input-${index}`).value;
                checkAnswer(q, answer, index);
            });
        });
    }

    async function checkAnswer(question, answer, questionIndex) {
        if (!originalStory) return showAlert('Error: Original story context is missing.');
        if (!answer.trim()) return showAlert('Please enter an answer before checking!');

        const checkButton = document.getElementById(`check-btn-${questionIndex}`);
        const inputField = document.getElementById(`answer-input-${questionIndex}`);
        const resultDiv = document.getElementById(`result-${questionIndex}`);
        
        if (checkButton.dataset.checked) return; // Prevent re-checking

        checkButton.disabled = true;
        checkButton.textContent = 'Checking...';
        inputField.readOnly = true;
        
        const checkApiUrl = '/api/check-answer/';

        try {
            const response = await fetch(checkApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ original_story: originalStory, question: question, user_answer: answer })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Check Answer Server Error:', response.status, errorText);
                showAlert(`Verification failed: ${response.status}. See console for details.`);
                return;
            }

            const data = await response.json();
            let resultClass = 'text-lg font-semibold mt-2 ';
            let scoreChange = 0; 

            // --- MoCA-Style Scoring for Quiz (Max 4 points per question) ---
            // Total max: 3 questions * 4 points = 12 points
            switch (data.result) {
                case 'Consistent':
                    resultClass += 'text-emerald-400';
                    scoreChange = 4.0; 
                    break;
                case 'Inconsistent':
                    resultClass += 'text-rose-400';
                    scoreChange = 0.0;
                    break;
                case 'Needs Elaboration':
                    resultClass += 'text-amber-400';
                    scoreChange = 2.0; 
                    break;
                default:
                    resultClass += 'text-slate-400';
            }
            
            // Update Quiz Score: only if this question hasn't been scored yet
            if (!checkButton.dataset.scored) {
                appState.quizScore += scoreChange;
                appState.questionsAnswered++;
                checkButton.dataset.scored = true; // Mark as scored
            }

            resultDiv.innerHTML = `<p class="${resultClass}">${data.result}</p><p class="text-sm text-slate-300">${data.feedback}</p>`;
            checkButton.dataset.checked = true; // Mark as checked

        } catch (error) {
            console.error("Error checking answer:", error);
            showAlert('An error occurred while communicating with the checker.');
        } finally {
            checkButton.textContent = 'Answer Checked';
            checkButton.disabled = true; 
            
            // Check if all questions have been answered/checked
            if (appState.questionsAnswered === appState.questionsTotal && appState.questionsTotal > 0) {
                quizCompletion.classList.remove('hidden');
            }
        }
    }
    
    // --- Phase 4: Final Score Calculation and Display ---
    function getRiskLevel(score, age) {
        // MoCA-standard benchmarks provided by user (Total Max 30)
        if (age >= 50 && age <= 59) {
            if (score < 22) return { text: 'High Risk (Dementia Range)', colorClass: 'text-rose-400' };
            if (score <= 25) return { text: 'Mild Risk (MCI Range)', colorClass: 'text-amber-400' };
            return { text: 'Low Risk (Normal Range)', colorClass: 'text-emerald-400' };
        }
        if (age >= 60 && age <= 69) {
            if (score < 21) return { text: 'High Risk (Dementia Range)', colorClass: 'text-rose-400' };
            if (score <= 24) return { text: 'Mild Risk (MCI Range)', colorClass: 'text-amber-400' };
            return { text: 'Low Risk (Normal Range)', colorClass: 'text-emerald-400' };
        }
        if (age >= 70 && age <= 79) {
            if (score < 20) return { text: 'High Risk (Dementia Range)', colorClass: 'text-rose-400' };
            if (score <= 23) return { text: 'Mild Risk (MCI Range)', colorClass: 'text-amber-400' };
            return { text: 'Low Risk (Normal Range)', colorClass: 'text-emerald-400' };
        }
        if (age >= 80) {
            if (score < 19) return { text: 'High Risk (Dementia Range)', colorClass: 'text-rose-400' };
            if (score <= 22) return { text: 'Mild Risk (MCI Range)', colorClass: 'text-amber-400' };
            return { text: 'Low Risk (Normal Range)', colorClass: 'text-emerald-400' };
        }
        return { text: 'Standard score (age benchmarks apply from 50+)', colorClass: 'text-slate-400' };
    }

    function calculateAndShowFinalScore() {
        const raw = appState.rawGameScores;
        
        // --- Game Scoring Functions (Total Max 18 Points) ---

        // Trail Connecting Game (Max 5 Points) - Like Visuospatial/Executive
        const getDotsScore = () => {
            const errors = raw.dots?.errors ?? 99;
            const time = raw.dots?.time ?? 999;
            // Short Note: Based on minimizing errors and time for cognitive speed.
            if (errors === 0 && time <= 30) return 5.0; 
            if (errors <= 2 && time <= 45) return 4.0;
            if (errors <= 4 && time <= 60) return 3.0;
            if (errors <= 6 && time <= 75) return 2.0;
            return 1.0;
        };

        // Card Game (Memory) (Max 6 Points) - Mirrors Attention/Executive (Errors)
        const getMemoryScore = () => {
            const errors = raw.memory?.errors ?? 99;
            // Short Note: Based on minimizing errors in matching pairs for attention and working memory.
            if (errors <= 2) return 6.0;   
            if (errors <= 4) return 5.0;   
            if (errors <= 6) return 4.0;  
            if (errors <= 8) return 3.0;  
            if (errors <= 10) return 2.0; 
            return 1.0;
        };

        // Digit Span (Sequence) (Max 4 Points) - Short Attention/Memory
        const getSequenceScore = () => {
            const correctDigits = raw.sequence?.correct ?? 0;
            // Short Note: 1 point per correct digit in the 5-digit sequence, assessing short-term memory capacity.
            return Math.min(4.0, correctDigits); 
        };

        // Naming Animals (Max 3 Points) - Language / Semantic Memory
        const getNamingScore = () => {
            const correctAnimals = raw.animal?.score ?? 0; 
            // Short Note: 1 point for each correctly named animal, assessing verbal fluency.
            return correctAnimals;
        };
        
        // --- 1. Calculate and Store Final Scores ---
        appState.finalScores.storyRecall = appState.quizScore;     // Max 12.0
        appState.finalScores.trailConnecting = getDotsScore();     // Max 5.0
        appState.finalScores.cardGame = getMemoryScore();          // Max 6.0
        appState.finalScores.digitSpan = getSequenceScore();       // Max 4.0
        appState.finalScores.namingAnimals = getNamingScore();     // Max 3.0

        // --- 2. Aggregate Total Score ---
        const scoreWithoutBonus = Object.values(appState.finalScores).reduce((sum, score) => sum + score, 0);
        const finalTotalScore = scoreWithoutBonus + appState.educationBonus;
        
        // *** NEW: Determine max score based on education bonus ***
        const maxScore = appState.educationBonus > 0 ? 31 : 30;

        // --- 3. Render Results View ---
        
        showView('view-results');
        
        finalTotalScoreEl.textContent = finalTotalScore.toFixed(1);
        finalMaxScoreEl.textContent = `/ ${maxScore}`; // Update max score display
        resultUserName.textContent = appState.userName;

        const risk = getRiskLevel(Math.floor(scoreWithoutBonus), appState.age);
        riskLevelDisplay.textContent = risk.text;
        riskLevelDisplay.className = `text-xl font-medium mt-4 ${risk.colorClass}`;

        scoreBreakdownList.innerHTML = `
            <li class="flex justify-between p-2">
                <span>📚 Story Recall Quiz:</span> 
                <strong>${appState.finalScores.storyRecall.toFixed(1)} / 12.0</strong>
            </li>
            <li class="flex justify-between p-2">
                <span>⚡ Trail Connecting Game:</span> 
                <strong>${appState.finalScores.trailConnecting.toFixed(1)} / 5.0</strong>
            </li>
            <li class="flex justify-between p-2">
                <span>🧠 Card Game (Memory):</span> 
                <strong>${appState.finalScores.cardGame.toFixed(1)} / 6.0</strong>
            </li>
            <li class="flex justify-between p-2">
                <span>🔢 Digit Span (Attention):</span> 
                <strong>${appState.finalScores.digitSpan.toFixed(1)} / 4.0</strong>
            </li>
            <li class="flex justify-between p-2">
                <span>🦁 Naming Animals (Fluency):</span> 
                <strong>${appState.finalScores.namingAnimals.toFixed(1)} / 3.0</strong>
            </li>
            <li class="flex justify-between p-2">
                <span>🎓 Education Bonus:</span> 
                <strong>${appState.educationBonus.toFixed(1)} / 1.0</strong>
            </li>
            <li class="flex justify-between p-2 mt-4 pt-3 border-t border-slate-700 font-bold text-emerald-300">
                <span>TOTAL SCORE:</span> 
                <strong>${finalTotalScore.toFixed(1)} / ${maxScore}</strong>
            </li>
            <li class="text-sm text-slate-400 mt-4 pt-2 border-t border-slate-700/50">
                *Note: Risk analysis is based on the standard 30-point score (excluding the 1-point education bonus).
            </li>
        `;
    }

    // --- Theme Switcher Logic ---
    function setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            themeIndicator.style.transform = 'translateX(1.5rem)';
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            themeIndicator.style.transform = 'translateX(0)';
            localStorage.setItem('theme', 'light');
        }
    }

    themeSwitcher.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'dark';
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // --- Event Listeners ---
    // Start View Listeners (Phase 0)
    educationYesBtn.addEventListener('click', () => updateEducationSelection(educationYesBtn));
    educationNoBtn.addEventListener('click', () => updateEducationSelection(educationNoBtn));
    
    nameInput.addEventListener('input', checkStartButton);
    ageInput.addEventListener('input', checkStartButton);
    
    startStoryButton.addEventListener('click', () => showView('view-storytelling'));

    // Storytelling Listeners (Phase 1)
    recordButton.addEventListener('click', () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    });
    startGamesButton.addEventListener('click', runNextTest);

    // Quiz Listeners (Phase 3)
    showResultsButton.addEventListener('click', calculateAndShowFinalScore);
    
    // Results Listeners (Phase 4)
    startOverButton.addEventListener('click', () => window.location.reload());
    printButton.addEventListener('click', () => window.print()); // Print functionality

    // --- Initializer ---
    showView('view-start');
    checkStartButton(); // Initial check on load

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
});
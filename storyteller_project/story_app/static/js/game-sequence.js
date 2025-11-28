// js/game-sequence.js

document.addEventListener('start-sequence', () => {
    // --- DOM Elements ---
    const display = document.getElementById('sequence-display');
    const startBtn = document.getElementById('sequence-start-btn');
    const answer = document.getElementById('sequence-answer');
    const checkBtn = document.getElementById('sequence-check-btn');
    const resultBox = document.getElementById('sequence-result');

    // --- Game State ---
    let seq = [];
    let isShowing = false;

    // --- Game Logic ---
    function generateSequence(n = 5) {
        const arr = [];
        for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 10));
        return arr;
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function playSequence(arr) {
        isShowing = true;
        answer.value = '';
        resultBox.style.display = 'none';
        answer.disabled = true;
        checkBtn.disabled = true;
        startBtn.disabled = true;

        for (let i = 0; i < arr.length; i++) {
            display.textContent = arr[i];
            await sleep(800);
            display.textContent = '•';
            await sleep(250);
        }
        display.textContent = '✓';
        isShowing = false;
        answer.disabled = false;
        answer.focus();
        checkBtn.disabled = false;
    }

    function parseUserInput(str) {
        const cleaned = str.trim().replace(/\s+/g, '');
        if (!cleaned) return [];
        return cleaned.split('').map(ch => Number(ch)).filter(n => Number.isInteger(n));
    }

    function compareSequences(target, user) {
        let correct = 0;
        for (let i = 0; i < target.length; i++) {
            if (user[i] === target[i]) {
                correct++;
            }
        }
        return { correct, total: target.length };
    }

    function renderResult(target, user, result) {
        const { correct, total } = result;
        const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
        resultBox.innerHTML = `
            <div class="font-bold">Result: ${correct} / ${total} correct (${accuracy}%)</div>
            <div class="mt-2"><strong>Target</strong>: <span class="mono">${target.join(' ')}</span></div>
            <div><strong>Entered</strong>: <span class="mono">${user.join(' ') || '(none)'}</span></div>
        `;
        resultBox.style.display = 'block';
    }
    
    // --- Event Listeners ---
    startBtn.addEventListener('click', async () => {
        if (isShowing) return;
        seq = generateSequence(5);
        await playSequence(seq);
    });

    checkBtn.addEventListener('click', () => {
        const userArr = parseUserInput(answer.value);
        const result = compareSequences(seq, userArr);
        renderResult(seq, userArr, result);
        checkBtn.disabled = true;
        answer.disabled = true;
        
        // Wait 2.5 seconds for user to see result, then end the game
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('gamecomplete', {
                detail: {
                    testName: 'sequence',
                    correct: result.correct,
                    total: result.total
                }
            }));
        }, 2500);
    });

    answer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !checkBtn.disabled) {
            checkBtn.click();
        }
    });
});
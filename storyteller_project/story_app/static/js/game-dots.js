// js/game-dots.js

document.addEventListener('start-dots', () => {
    // --- DOM Element References ---
    const canvas = document.getElementById('dots-board');
    const ctx = canvas.getContext('2d');
    const timeEl = document.getElementById('dots-time');
    const accuracyEl = document.getElementById('dots-accuracy');

    // --- Game State & Constants ---
    const DOT_COUNT = 8;
    const BASE_RADIUS = 18;
    const MARGIN_FRAC = 0.08;

    let dots = [], drawnSegments = [];
    let taps = 0, correctInSequence = 0, expectedNext = 1;
    let startTime = 0, finished = false;

    // --- Main Initialization Function ---
    function initialize() {
        dots = [];
        drawnSegments = [];
        taps = 0;
        correctInSequence = 0;
        expectedNext = 1;
        finished = false;
        timeEl.textContent = '0.0s';
        accuracyEl.textContent = '100%';
        startTime = performance.now();
        setupBackingStore();
        dots = generateDots();
        draw();
        requestAnimationFrame(tickTime);
    }

    // --- Responsive Canvas & HiDPI Setup ---
    function setupBackingStore() {
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }
    }

    // --- Dot Generation & Geometry ---
    function randRange(min, max) { return Math.random() * (max - min) + min; }
    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    function currentMetrics() {
        const rect = canvas.getBoundingClientRect();
        const minSide = Math.min(rect.width, rect.height);
        const margin = MARGIN_FRAC * minSide;
        const radius = Math.max(14, BASE_RADIUS * (minSide / 600));
        return { rect, margin, radius };
    }

    function generateDots() {
        const { rect, margin, radius } = currentMetrics();
        const minGap = radius * 3.5;
        const arr = [];
        let attempts = 0;
        for (let label = 1; label <= DOT_COUNT; label++) {
            let placed = false;
            while (!placed && attempts < 5000) {
                attempts++;
                const x = randRange(margin + radius, rect.width - margin - radius);
                const y = randRange(margin + radius, rect.height - margin - radius);
                if (arr.every(p => dist(p, { x, y }) > minGap)) {
                    arr.push({ x, y, label });
                    placed = true;
                }
            }
        }
        return arr.sort((a, b) => a.label - b.label);
    }

    // --- Drawing Logic ---
    function getCSS(varName) {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    function draw() {
        const { rect, radius } = currentMetrics();
        ctx.clearRect(0, 0, rect.width, rect.height);
        drawnSegments.forEach(seg => {
            const a = dots.find(d => d.label === seg.fromIdx);
            const b = dots.find(d => d.label === seg.toIdx);
            if (!a || !b) return;
            ctx.lineWidth = seg.correct ? 5 : 4;
            ctx.strokeStyle = seg.correct ? getCSS('--line-correct') : getCSS('--line-wrong');
            ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        });
        dots.forEach(p => {
            const isExpected = (p.label === expectedNext && !finished);
            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isExpected ? getCSS('--dot-active') : getCSS('--dot');
            ctx.fill();
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = 'hsl(210 25% 95% / 0.8)';
            ctx.stroke();
            ctx.fillStyle = 'hsl(210 25% 10%)';
            ctx.font = `600 ${Math.round(radius * 0.9)}px Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(p.label), p.x, p.y);
        });
    }

    // --- MODIFIED Input Handling & Game Logic ---
    function onPointerDown(evt) {
        if (finished) return;
        evt.preventDefault();

        // Get canvas metrics and click position once at the start.
        // This is more efficient and reliable.
        const rect = canvas.getBoundingClientRect();
        const clickPos = { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
        const radius = currentMetrics().radius; // We only need the radius for hit detection.

        // Find the specific dot that was clicked.
        const hitDot = dots.find(dot => dist(clickPos, dot) <= radius);

        // If no dot was hit, simply exit the function.
        if (!hitDot) {
            return;
        }

        // --- The rest of the logic remains the same, but uses the new 'hitDot' variable ---
        taps++;
        if (hitDot.label === expectedNext) {
            if (expectedNext > 1) {
                drawnSegments.push({ fromIdx: expectedNext - 1, toIdx: expectedNext, correct: true });
            }
            expectedNext++;
            correctInSequence++;
        } else {
            const from = Math.max(1, expectedNext - 1);
            if (from !== hitDot.label) {
                drawnSegments.push({ fromIdx: from, toIdx: hitDot.label, correct: false });
            }
        }

        if (expectedNext > DOT_COUNT) {
            computeAndFinish();
        } else {
            accuracyEl.textContent = `${taps > 0 ? ((correctInSequence / taps) * 100).toFixed(0) : 100}%`;
        }
        draw();
    }

    function computeAndFinish() {
        finished = true;
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        const accuracy = taps > 0 ? (correctInSequence / taps) : 1;
        const errors = taps - correctInSequence; // Calculate errors

        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('gamecomplete', {
                detail: {
                    testName: 'dots',
                    time: elapsedSeconds,
                    accuracy: accuracy,
                    errors: errors // UPDATED: Send the error count
                }
            }));
        }, 800);
    }

    function tickTime() {
        if (finished) return;
        timeEl.textContent = `${((performance.now() - startTime) / 1000).toFixed(1)}s`;
        requestAnimationFrame(tickTime);
    }
    
    canvas.addEventListener('pointerdown', onPointerDown);

    initialize();
});
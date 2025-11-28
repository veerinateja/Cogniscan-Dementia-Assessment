// --- Event Listener to Start the Game ---
document.addEventListener('start-memory', () => {
    // --- Constants & State ---
    // UPDATED: Reduced from 8 icons to 4 to create a total of 8 cards (4 pairs)
    const ICONS = ['sports_esports', 'eco', 'pets', 'photo_camera'];
    const cardGridContainer = document.getElementById('memory-grid-container');
    const gameErrorsSpan = document.getElementById('memory-errors');

    let flippedCards = [];
    let matchedPairs = 0;
    let errors = 0;
    let isProcessing = false;

    // --- Main Initialization Function ---
    function initialize() {
        matchedPairs = 0;
        errors = 0;
        flippedCards = [];
        isProcessing = false;
        gameErrorsSpan.textContent = errors;

        const gameIcons = [...ICONS, ...ICONS].sort(() => 0.5 - Math.random());
        cardGridContainer.innerHTML = '';

        gameIcons.forEach(icon => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.dataset.icon = icon;
            card.innerHTML = `
                <div class="front"></div>
                <div class="back"><span class="material-symbols-rounded">${icon}</span></div>
            `;
            card.addEventListener('click', () => onCardClick(card));
            cardGridContainer.appendChild(card);
        });
    }

    // --- Game Logic ---
    function onCardClick(card) {
        if (isProcessing || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }
        card.classList.add('flipped');
        flippedCards.push(card);

        if (flippedCards.length === 2) {
            isProcessing = true;
            checkForMatch();
        }
    }

    function checkForMatch() {
        const [card1, card2] = flippedCards;
        if (card1.dataset.icon === card2.dataset.icon) {
            // It's a match
            card1.classList.add('matched');
            card2.classList.add('matched');
            matchedPairs++;
            flippedCards = [];
            isProcessing = false;
            // Check for win condition
            if (matchedPairs === ICONS.length) {
                setTimeout(computeAndFinish, 800);
            }
        } else {
            // Not a match
            errors++;
            gameErrorsSpan.textContent = errors;
            setTimeout(() => {
                card1.classList.remove('flipped');
                card2.classList.remove('flipped');
                flippedCards = [];
                isProcessing = false;
            }, 1200);
        }
    }

    function computeAndFinish() {
        document.dispatchEvent(new CustomEvent('gamecomplete', {
            detail: {
                testName: 'memory',
                errors: errors
            }
        }));
    }

    // --- Start ---
    initialize();
});
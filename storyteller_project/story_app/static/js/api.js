async function analyzeAssessment(transcriptS1, gameMetrics, transcriptS2) {
    const apiEndpoint = `${BACKEND_URL}/api/analyze`;

    const payload = {
        transcript_s1: transcriptS1,
        game_metrics: gameMetrics,
        transcript_s2: transcriptS2,
    };

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            // Handle server errors (e.g., 500 Internal Server Error)
            throw new Error(`Server responded with status: ${response.status}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        // Handle network errors (e.g., backend server is not running)
        console.error('Error communicating with the backend:', error);
        throw error; // Re-throw the error to be caught by the caller in main.js
    }
}
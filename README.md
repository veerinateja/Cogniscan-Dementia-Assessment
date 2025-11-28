<!-- PROJECT LOGO -->

<h1 align="center">🧠 Cogniscan – Dementia Cognitive Assessment System</h1>

<p align="center">
  A gamified cognitive assessment system for dementia screening using MoCA-inspired tasks,
  voice-to-text story capture, automated question generation, and cognitive performance reporting.
</p>

---

## 🧠 Overview

Cogniscan is developed to support early cognitive decline detection through digital assessment instead of traditional MoCA paper testing.  
Users narrate a memory, play cognitive mini-games, and answer recall-based questions generated from their own spoken story.

Gemini API handles voice-to-text and automated question creation.  
Final output generates a cognitive performance report containing memory strength, recall ability, and response behavior.

---

## ✨ Key Features

| Feature | Description |
|--------|-------------|
| 🔊 Voice → Text via Gemini | Converts narration into analyzable text |
| 🎮 MoCA-style Mini Games | Tests memory, focus, and attention |
| ❓ Story-Based Recall Questions | Auto-generated using narrated story |
| 📊 Performance Report | Summary of cognitive strength |
| 👵 Age-Aware Flow | Difficulty varies with age |

---

## 📂 Project Flow

1. 📝 **Start the Assessment**
2. 👤 Enter patient details (age, name, etc.)
3. 🎙 User narrates a personal memory (e.g., birthday)
4. 🤖 Gemini converts speech → text
5. 🎮 Cognitive mini-games are played
6. ❓ System creates recall questions from the narration
7. 🧠 User answers the recall test
8. 📊 Score is calculated
9. 📝 Final report is generated
10. ✔ Assessment Completed

---

## 🔑 Gemini API Configuration (Required)
Add the following to the **bottom of settings.py**:

Add your Gemini API key for speech-to-text conversion and automatic question generation. Without this key, core features will not function.

GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE"



---
### 🏆 Developed at Hackathon
This project was initially conceptualized and developed during a hackathon at NSRIT college,  
where the idea of replacing MoCA paper tests with a gamified digital assessment  
was presented and implemented as a working prototype.

### ⭐ If this project helped you, please star ⭐ the repository.

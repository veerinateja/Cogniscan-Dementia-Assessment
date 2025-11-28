# storyteller_project/story_app/views.py

import base64
import json
import requests
from django.shortcuts import render
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from .models import Story

# Get the Gemini API Key from settings
GEMINI_API_KEY = getattr(settings, 'GEMINI_API_KEY', None)
# Define the Gemini API URL
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

def index(request):
    """Renders the main page of the application."""
    return render(request, 'index.html')

def about(request):
    """Renders the about page of the application."""
    return render(request, 'about.html')

@csrf_exempt
def process_audio_and_generate_questions(request):
    """
    Receives base64-encoded audio, transcribes it using Gemini,
    and then generates follow-up questions.
    """
    if request.method != 'POST':
        return HttpResponseBadRequest("Only POST method is allowed.")

    if not GEMINI_API_KEY:
        return HttpResponseServerError("API key is not configured on the backend.")

    try:
        data = json.loads(request.body)
        audio_data = data.get('audio_data')
        if not audio_data:
            return HttpResponseBadRequest("Missing 'audio_data' in the request body.")
    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON.")

    import logging
    logger = logging.getLogger("django")
    try:
        # 1. Audio Transcription with Gemini
        transcribe_payload = {
            "contents": [{
                "parts": [{
                    "inline_data": {
                        "mime_type": "audio/webm",
                        "data": audio_data
                    }
                }]
            }]
        }
        transcribe_response = requests.post(GEMINI_API_URL, json=transcribe_payload)
        transcribe_response.raise_for_status()
        transcribe_json = transcribe_response.json()
        logger.info(f"Gemini transcription response: {transcribe_json}")
        # Defensive extraction
        try:
            transcribed_text = transcribe_json['candidates'][0]['content']['parts'][0].get('text', None)
        except (KeyError, IndexError, TypeError) as err:
            logger.error(f"Error extracting transcription: {err}")
            return HttpResponseServerError("Failed to extract transcription from Gemini response.")
        transcribed_text = transcribed_text.strip() if transcribed_text else "Transcription failed. Please try again."

        # 2. Question Generation with Gemini
        system_prompt = (
            "You are a focused assistant. Your task is to analyze a short story and generate three questions "
            "that are **ONLY** based on the explicit words and details mentioned in the story. "
            "DO NOT make any assumptions. YOUR QUESTIONS MUST BE ANSWERABLE USING ONLY THE TEXT PROVIDED. "
            "Your response MUST be a JSON array of strings, with each string being a question. "
            "DO NOT include any other text."
        )
        user_query = f"The user has told this story: '{transcribed_text}'. What are the three best follow-up questions that are strictly based on this text?"

        question_payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_query}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "ARRAY",
                    "items": {"type": "STRING"}
                }
            }
        }
        question_response = requests.post(GEMINI_API_URL, json=question_payload)
        question_response.raise_for_status()
        question_json = question_response.json()
        logger.info(f"Gemini question response: {question_json}")
        try:
            generated_questions_text = question_json['candidates'][0]['content']['parts'][0].get('text', None)
        except (KeyError, IndexError, TypeError) as err:
            logger.error(f"Error extracting questions: {err}")
            return HttpResponseServerError("Failed to extract questions from Gemini response.")
        try:
            generated_questions_list = json.loads(generated_questions_text)
        except Exception as err:
            logger.error(f"Error parsing questions JSON: {err}")
            return HttpResponseServerError("Failed to parse questions JSON from Gemini response.")

        # 3. Save to Database
        try:
            Story.objects.create(
                user_story=transcribed_text,
                generated_questions=generated_questions_list
            )
        except Exception as err:
            logger.error(f"Error saving Story to DB: {err}")
            return HttpResponseServerError("Failed to save story and questions to database.")

        return JsonResponse({"story": transcribed_text, "questions": generated_questions_list})

    except requests.exceptions.RequestException as err:
        logger.error(f"Gemini API request failed: {err}")
        return HttpResponseServerError(f"API request failed: {err}")
    except Exception as e:
        logger.error(f"Unexpected error in process_audio_and_generate_questions: {e}")
        return HttpResponseServerError(f"An unexpected error occurred: {e}")

@csrf_exempt
def check_user_answer(request):
    """
    Checks the user's answer against the original story for consistency.
    """
    if request.method != 'POST':
        return HttpResponseBadRequest("Only POST method is allowed.")

    if not GEMINI_API_KEY:
        return HttpResponseServerError("API key is not configured on the backend.")

    try:
        data = json.loads(request.body)
        original_story = data.get('original_story')
        question = data.get('question')
        user_answer = data.get('user_answer')

        if not all([original_story, question, user_answer]):
            return HttpResponseBadRequest("Missing required data (story, question, or answer).")

    except json.JSONDecodeError:
        return HttpResponseBadRequest("Invalid JSON.")

    try:
        system_prompt = (
            "You are a story consistency engine. Your job is to compare the USER'S ANSWER with the ORIGINAL STORY. "
            "Determine if the answer is: 1. 'Consistent', 2. 'Inconsistent', or 3. 'Needs Elaboration'. "
            "Your response MUST be a JSON object with 'result' (string: 'Consistent', 'Inconsistent', or 'Needs Elaboration') "
            "and 'feedback' (string) explaining your decision briefly."
        )
        user_query = (
            f"ORIGINAL STORY: '{original_story}'\n"
            f"QUESTION: '{question}'\n"
            f"USER'S ANSWER: '{user_answer}'\n"
            "Analyze and provide the JSON verification object."
        )

        verify_payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_query}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "OBJECT",
                    "properties": {
                        "result": {"type": "STRING", "enum": ["Consistent", "Inconsistent", "Needs Elaboration"]},
                        "feedback": {"type": "STRING"}
                    },
                    "required": ["result", "feedback"]
                }
            }
        }
        
        verify_response = requests.post(GEMINI_API_URL, json=verify_payload)
        verify_response.raise_for_status()
        
        verification_text = verify_response.json()['candidates'][0]['content']['parts'][0]['text']
        verification_data = json.loads(verification_text)

        return JsonResponse(verification_data)

    except requests.exceptions.RequestException as err:
        return HttpResponseServerError(f"API verification failed: {err}")
    except Exception as e:
        return HttpResponseServerError(f"An unexpected error occurred during verification: {e}")
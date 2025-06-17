import time
import json
import os
import openai

openai.api_key = os.getenv("OPENAI_API_KEY")  # export this in Termux

def chat_with_ai(message):
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # Or your preferred model
        messages=[{"role": "user", "content": message}]
    )
    return response['choices'][0]['message']['content']

print("AI handler started. Watching for messages...")

while True:
    try:
        with open('bridge.json', 'r') as f:
            data = json.load(f)
        if 'message' in data and 'reply' not in data:
            reply = chat_with_ai(data['message'])
            data['reply'] = reply
            with open('bridge.json', 'w') as f:
                json.dump(data, f)
    except:
        pass
    time.sleep(1)

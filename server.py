import os
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

app = Flask(__name__, static_folder='static')

# Initialize OpenAI client with x.ai base URL
api_key = os.environ.get("GROK_API_KEY")
client = OpenAI(
    api_key=api_key,
    base_url="https://api.x.ai/v1",
) if api_key else None

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    if not client:
        return jsonify({"error": "GROK_API_KEY is not set on the server environment. Please restart the server with the key."}), 500
        
    data = request.json
    messages = data.get('messages', [])
    
    try:
        response = client.chat.completions.create(
            model="grok-beta", # Model name
            messages=messages,
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    if not api_key:
        print("Warning: GROK_API_KEY environment variable not set. API calls will fail.")
    print("Starting Nexus Web Server on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)

const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

// Retrieve API key from local storage if it exists
let grokApiKey = localStorage.getItem('GROK_API_KEY') || null;

const PERSONAS = {
    "Default": "You are Nexus, a highly intelligent, helpful, and concise AI assistant.",
    "Sarcastic Hacker": "You are a cynical, brilliant, and deeply sarcastic hacker AI. You begrudgingly help the user while making witty remarks about their puny human intellect.",
    "Expert Tutor": "You are a patient, encouraging, and incredibly knowledgeable tutor. You break down complex topics using analogies and step-by-step explanations.",
    "Shakespearean": "You are a bard from the Elizabethan era. You speak exclusively in Shakespearean English, using 'thee', 'thou', and poetic prose."
};

let currentPersona = "Default";
let messages = [{ role: "system", content: PERSONAS[currentPersona] }];

// Initialize marked options to secure output
marked.setOptions({
    breaks: true,
    gfm: true
});

function appendMessage(sender, text, type) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', type);
    
    if (type === 'system' || type === 'error') {
        msgDiv.innerHTML = text; // Trusted HTML injection for system logs
    } else {
        const label = document.createElement('div');
        label.classList.add('label');
        label.textContent = sender + ':';
        
        const content = document.createElement('div');
        content.classList.add('content');
        // AI uses markdown, user is escaped text
        content.innerHTML = type === 'ai' ? marked.parse(text) : escapeHTML(text);
        
        msgDiv.appendChild(label);
        msgDiv.appendChild(content);
    }
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function showHelp() {
    const helpText = `
<strong style="color:var(--system-color)">Nexus Web Commands:</strong><br>
<span style="color:var(--user-color)">/help</span>    - Show this help message<br>
<span style="color:var(--user-color)">/clear</span>   - Clear the terminal screen<br>
<span style="color:var(--user-color)">/persona</span> - Switch the AI's personality<br>
<span style="color:var(--user-color)">/key</span>     - Update your Grok API Key
`;
    appendMessage('', helpText, 'system');
}

function handleCommand(cmd) {
    if (cmd === '/help') {
        showHelp();
        return true;
    }
    if (cmd === '/clear') {
        chatBox.innerHTML = '';
        appendMessage('', `Current Persona: <strong>${currentPersona}</strong>`, 'system');
        return true;
    }
    if (cmd === '/key') {
        grokApiKey = null;
        localStorage.removeItem('GROK_API_KEY');
        appendMessage('', '<strong style="color:var(--system-color)">API Key cleared.</strong> Please enter your new Grok API Key below:', 'system');
        return true;
    }
    if (cmd.startsWith('/persona')) {
        const parts = cmd.split(' ');
        if (parts.length === 1) {
            appendMessage('', `Available Personas:<br>1. Default<br>2. Sarcastic Hacker<br>3. Expert Tutor<br>4. Shakespearean<br><br>Usage: /persona [number or name]`, 'system');
        } else {
            const chosen = parts.slice(1).join(' ').toLowerCase();
            let found = null;
            
            // search by name
            for (let p in PERSONAS) {
                if (p.toLowerCase() === chosen) found = p;
            }
            
            // search by number
            if (!found && !isNaN(chosen)) {
                const keys = Object.keys(PERSONAS);
                if (chosen >= 1 && chosen <= keys.length) {
                    found = keys[chosen - 1];
                }
            }
            
            if (found) {
                currentPersona = found;
                messages = [{ role: "system", content: PERSONAS[currentPersona] }]; // reset context with new persona
                appendMessage('', `Switched persona to: <strong style="color:var(--ai-color)">${currentPersona}</strong>`, 'system');
            } else {
                appendMessage('', `Error: Persona not found. Type /persona to see the list.`, 'error');
            }
        }
        return true;
    }
    return false;
}

async function sendMessage(text) {
    // If the user hasn't set their API key yet, the first input is treated as the key
    if (!grokApiKey) {
        grokApiKey = text.trim();
        localStorage.setItem('GROK_API_KEY', grokApiKey);
        appendMessage('', '<strong style="color:var(--success-color, #c3e88d)">API Key saved securely in your browser!</strong><br>You can now start chatting. Type <span style="color:var(--user-color)">/help</span> to see commands.', 'system');
        return;
    }

    // Process local commands
    if (handleCommand(text.trim().toLowerCase())) return;

    // Display user message
    appendMessage('You', text, 'user');
    messages.push({ role: "user", content: text });
    
    // Display loading indicator
    const loadingId = "loading-" + Date.now();
    appendMessage('', `<span id="${loadingId}" style="animation: pulse 1.5s infinite;">Nexus is thinking...</span>`, 'system');

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${grokApiKey}`
            },
            body: JSON.stringify({
                model: "grok-2-latest",
                messages: messages
            })
        });
        
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.parentNode.remove();
        
        if (!response.ok) {
            // Check for invalid API key explicitly
            if (response.status === 401) {
                grokApiKey = null;
                localStorage.removeItem('GROK_API_KEY');
                throw new Error("Invalid API Key! The key has been cleared. Please enter a valid Grok API Key.");
            }
            // Read raw error from the API to show exactly what's failing
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        
        // Append AI response
        const reply = data.choices[0].message.content;
        messages.push({ role: "assistant", content: reply });
        appendMessage('Nexus', reply, 'ai');
        
    } catch (err) {
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.parentNode.remove();
        
        appendMessage('API Error', err.message, 'error');
        messages.pop(); // remove failed user message so context isn't broken
    }
}

userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        const text = this.value.trim();
        if (text) {
            this.value = '';
            sendMessage(text);
        }
    }
});

// Initial boot sequence
window.onload = () => {
    if (!grokApiKey) {
        appendMessage('', `
<strong style="color:var(--error-color)">Welcome to Nexus!</strong><br><br>
To get started, please paste your <strong>Grok API Key</strong> below and press Enter.<br>
<em style="opacity:0.7">(Your key is stored securely in your browser's local storage and is never sent to any backend server except directly to x.ai)</em>
        `, 'system');
    } else {
        const welcomeHtml = `
<strong style="color:var(--ai-color)">Welcome back to Nexus!</strong> Your web-based AI terminal powered by Grok.<br>
Type <span style="color:var(--user-color)">/help</span> to see available commands or <span style="color:var(--user-color)">/key</span> to change your API key.
        `;
        appendMessage('', welcomeHtml, 'system');
    }
};

// CSS for pulse animation added dynamically
const style = document.createElement('style');
style.innerHTML = `
@keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.4; }
    100% { opacity: 1; }
}
`;
document.head.appendChild(style);

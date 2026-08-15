const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');

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
<span style="color:var(--user-color)">/persona</span> - Switch the AI's personality
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
    // Process local commands
    if (handleCommand(text.trim().toLowerCase())) return;

    // Display user message
    appendMessage('You', text, 'user');
    messages.push({ role: "user", content: text });
    
    // Display loading indicator
    const loadingId = "loading-" + Date.now();
    appendMessage('', `<span id="${loadingId}" style="animation: pulse 1.5s infinite;">Nexus is thinking...</span>`, 'system');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        
        const data = await response.json();
        
        // Remove loading indicator
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) loadingElement.parentNode.remove();
        
        if (!response.ok) {
            throw new Error(data.error || 'Server error');
        }
        
        // Append AI response
        messages.push({ role: "assistant", content: data.reply });
        appendMessage('Nexus', data.reply, 'ai');
        
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
    const welcomeHtml = `
<strong style="color:var(--ai-color)">Welcome to Nexus!</strong> Your web-based AI terminal powered by Grok.<br>
Type <span style="color:var(--user-color)">/help</span> to see available commands.
    `;
    appendMessage('', welcomeHtml, 'system');
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

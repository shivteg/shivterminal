# 🤖 Nexus: Terminal & Web Chatbot (GEMINI.md)

This document provides context for Gemini assistants working on the **shivterminal** repository.

## 🎯 Project Overview
Nexus is a beautiful, interactive, and terminal-themed AI chatbot powered by the x.ai (Grok) API. 
The project began as a Python CLI application and was successfully transitioned into a 100% client-side web application designed to run seamlessly on GitHub Pages without a backend server.

## 🏗️ Architecture & Technologies
- **Frontend Stack**: Vanilla HTML5, CSS3, JavaScript.
- **Styling**: Custom CSS designed to mimic a modern code terminal (dark theme, color-coded text for user/AI/system logs).
- **Markdown Parsing**: `marked.js` is used to render AI responses with proper code blocks and formatting.
- **Deployment**: Hosted statically on GitHub Pages at [https://shivteg.github.io/shivterminal/](https://shivteg.github.io/shivterminal/).
- **AI Integration**: Direct client-side `fetch` calls to the `x.ai` API (`https://api.x.ai/v1/chat/completions`).

## ✨ Core Features
1. **Persona Switching**: Built-in slash command (`/persona`) to dynamically switch system prompts (Default, Sarcastic Hacker, Expert Tutor, Shakespearean).
2. **Slash Commands**: `/help`, `/clear`, `/key` (to update the API key).
3. **Local Storage**: Securely prompts the user for their `GROK_API_KEY` on first load and stores it in the browser's `localStorage` so it is never exposed in the code.

## 🐛 Current Bug & Development Status (To Fix Tomorrow)
- **The Issue**: When the user enters their API key and sends a message, the application successfully reaches the API but receives the following rejection:
  `API Error 400: {"code":"invalid-argument","error":"Incorrect API key provided. You can obtain an API key from https://console.x.ai."}`
- **What We Have Verified**:
  - The `fetch` request is reaching the x.ai server successfully (CORS is not blocking it).
  - The model string used is `grok-4.6` (the most recent standard model as of August 2026).
  - The JS code automatically strips quotes (`"`, `'`) and trailing spaces from the inputted API key.
- **Next Steps for Tomorrow**:
  1. Verify the exact string of the API key (e.g., ensure it starts with `xai-` and is not an OpenAI `sk-...` key).
  2. Confirm if the x.ai account has sufficient billing credits or if the generated key requires specific endpoint permissions on the dashboard.
  3. Run a raw `curl` or Postman test with the exact key to isolate if the issue is with the key itself or a strange quirk in how the browser sends the Authorization header.

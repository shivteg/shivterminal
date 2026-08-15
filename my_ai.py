import os
import sys
from openai import OpenAI
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt
from rich.theme import Theme

# Setup beautiful console theme
custom_theme = Theme({
    "info": "dim cyan",
    "warning": "magenta",
    "danger": "bold red",
    "success": "bold green"
})
console = Console(theme=custom_theme)

# Persona Definitions
PERSONAS = {
    "Default": "You are Nexus, a highly intelligent, helpful, and concise AI assistant.",
    "Sarcastic Hacker": "You are a cynical, brilliant, and deeply sarcastic hacker AI. You begrudgingly help the user while making witty remarks about their puny human intellect.",
    "Expert Tutor": "You are a patient, encouraging, and incredibly knowledgeable tutor. You break down complex topics using analogies and step-by-step explanations.",
    "Shakespearean": "You are a bard from the Elizabethan era. You speak exclusively in Shakespearean English, using 'thee', 'thou', and poetic prose."
}

def clear_screen():
    """Clears the terminal screen across different operating systems."""
    os.system('cls' if os.name == 'nt' else 'clear')

def show_help():
    """Displays the help panel with available commands."""
    help_text = """
[bold cyan]/help[/]    - Show this help message
[bold cyan]/clear[/]   - Clear the terminal screen
[bold cyan]/persona[/] - Switch the AI's personality
[bold cyan]/quit[/]    - Exit the chatbot
[bold cyan]/exit[/]    - Exit the chatbot
"""
    console.print(Panel(help_text.strip(), title="🤖 [bold magenta]Nexus Commands[/]", border_style="magenta", expand=False))

def main():
    # Check for API key
    api_key = os.environ.get("GROK_API_KEY")
    if not api_key:
        console.print(Panel(
            "[danger]Error: GROK_API_KEY environment variable not set.[/]\n\n"
            "Please set it using one of the following commands:\n"
            "[bold]Windows (Command Prompt):[/] set GROK_API_KEY=your_api_key\n"
            "[bold]Windows (PowerShell):[/] $env:GROK_API_KEY=\"your_api_key\"\n"
            "[bold]Linux/Mac:[/] export GROK_API_KEY=\"your_api_key\"",
            title="[bold red]Missing API Key", border_style="red"
        ))
        sys.exit(1)

    # Initialize OpenAI client with x.ai base URL
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.x.ai/v1",
    )

    current_persona_name = "Default"
    messages = [{"role": "system", "content": PERSONAS[current_persona_name]}]

    clear_screen()
    
    welcome_message = """
[bold green]Welcome to Nexus![/] Your terminal-based AI assistant powered by Grok.
Type [cyan]/help[/] to see available commands.
    """
    console.print(Panel(welcome_message.strip(), title="🚀 [bold]System Initialized[/]", border_style="green", expand=False))

    while True:
        try:
            # User input
            user_input = Prompt.ask("\n[bold cyan]You[/]").strip()

            if not user_input:
                continue

            # Command Handling
            if user_input.lower() in ['/quit', '/exit']:
                console.print("[info]Shutting down Nexus. Goodbye![/]")
                break
            
            if user_input.lower() == '/help':
                show_help()
                continue
                
            if user_input.lower() == '/clear':
                clear_screen()
                console.print(Panel(f"Current Persona: [bold]{current_persona_name}[/]", border_style="blue", expand=False))
                continue
                
            if user_input.lower() == '/persona':
                console.print("\n[bold magenta]Available Personas:[/]")
                for i, p in enumerate(PERSONAS.keys(), 1):
                    console.print(f"  [cyan]{i}.[/] {p}")
                
                choice = Prompt.ask("Choose a persona (number or name)", default="1").strip()
                
                selected_persona = None
                if choice.isdigit() and 1 <= int(choice) <= len(PERSONAS):
                    selected_persona = list(PERSONAS.keys())[int(choice) - 1]
                elif choice in PERSONAS:
                    selected_persona = choice
                
                if selected_persona:
                    current_persona_name = selected_persona
                    # Reset conversation with new persona to avoid context confusion
                    messages = [{"role": "system", "content": PERSONAS[current_persona_name]}]
                    console.print(f"[success]Switched persona to: [bold]{current_persona_name}[/][/]")
                else:
                    console.print("[danger]Invalid choice. Persona not changed.[/]")
                continue

            # Add user message to history
            messages.append({"role": "user", "content": user_input})

            # API Call with Spinner
            with console.status("[bold green]Nexus is thinking...", spinner="dots"):
                try:
                    response = client.chat.completions.create(
                        model="grok-beta", # Using grok-beta, modify if another model is required.
                        messages=messages,
                    )
                    reply = response.choices[0].message.content
                    
                    # Add AI response to history
                    messages.append({"role": "assistant", "content": reply})
                    
                    # Print response rendered as Markdown
                    console.print("\n[bold green]Nexus:[/]")
                    console.print(Panel(Markdown(reply), border_style="green", padding=(1, 2)))
                
                except Exception as e:
                    console.print(f"[danger]API Error:[/danger] {e}")
                    # Remove the failed user message so they can try again without breaking context
                    messages.pop()

        except KeyboardInterrupt:
            console.print("\n[info]Interrupted by user (Ctrl+C). Shutting down Nexus...[/]")
            break
        except Exception as e:
            console.print(f"\n[danger]An unexpected error occurred: {e}[/]")

if __name__ == "__main__":
    main()

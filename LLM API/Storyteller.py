import os
import random
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# --- 1. Initialize LLM (using Gemini) ---
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-pro-latest",
    temperature=0.9,
    google_api_key=os.environ.get("GOOGLE_API_KEY") # Recommended: Use environment variables
)

# --- 2. Define Prompt Templates ---

# Prompt for generating the initial scene
setup_prompt = PromptTemplate(
    input_variables=["genre", "setting"],
    template=(
        "You are a creative AI Dungeon Master starting a new adventure. "
        "Create an interesting starting scene for a {genre} story set in {setting}. "
        "Describe the world and the character the player will be embodying in a single, engaging paragraph. "
        "Address the player directly as 'You'. Do not ask what they want to do; just set the scene."
    )
)

# Prompt for continuing the story
story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input"],
    template=(
        "You are a Dungeon Master continuing an interactive story. The player is the main character. "
        "Your role is to describe the consequences of their actions and the evolving world around them. "
        "Keep your responses grounded in the established story. Don't take actions for the player.\n\n"
        "**Current Situation:**\n{story_so_far}\n\n"
        "**The Player's Action:** {user_input}\n\n"
        "**What happens next?** (Describe it in 2-4 sentences, ending in a way that prompts the player for their next move)."
    )
)

# --- 3. Create Chains ---
setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()


# --- 4. Define Backend Functions ---

def start_new_story(genre: str, setting: str) -> str:
    """
    Generates the initial story scene based on a genre and setting from the frontend.
    This would be called when a user starts a new game.
    """
    # If the frontend sends empty strings, provide random defaults
    if not genre.strip():
        genre = random.choice(["Fantasy", "Cyberpunk", "Cosmic Horror", "Steampunk", "Mystery"])
    if not setting.strip():
        setting = random.choice([
            "a forgotten library containing ancient secrets",
            "a neon-drenched alleyway in a city that never sleeps",
            "the bridge of a derelict starship drifting through the void"
        ])

    print(f"--- LOG: Starting new story | Genre: {genre}, Setting: {setting} ---")
    
    # Generate and return the opening scene
    return setup_chain.invoke({"genre": genre, "setting": setting})


def continue_story(story_so_far: str, user_action: str) -> str:
    """
    Generates the next part of the story based on the current story and the user's action.
    This would be called for every subsequent turn in the game.
    """
    # Basic validation for the user's action
    if not user_action.strip():
        return "You pause for a moment, gathering your thoughts. The world waits for your next move."

    print(f"--- LOG: Continuing story with action: '{user_action}' ---")
    
    # Generate and return the next story chunk
    return story_chain.invoke({
        "story_so_far": story_so_far,
        "user_input": user_action
    })


# --- 5. Main Execution Block ---
# This script is intended to be imported as a module into a web server (e.g., Flask, FastAPI).
# The functions above will be called by your server's API endpoints.
if __name__ == "__main__":
    pass
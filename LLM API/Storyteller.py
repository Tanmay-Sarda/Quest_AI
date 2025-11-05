import os
import random
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()


# --- LLM Setup ---
llm = ChatGroq(
    model="llama-3.3-70b-versatile",  # Use a current, supported model
    temperature=0.9,
    groq_api_key=os.environ.get("GROQ_API_KEY")
)

# --- 2. Define Prompt Templates ---

# Prompt for generating the initial scene with dialect awareness
setup_prompt = PromptTemplate(
    input_variables=["genre", "setting", "dialect"],
    template=(
        "You are a creative AI Dungeon Master speaking in {dialect} and starting a new adventure. "
        "Always write in that dialect’s tone, word choice, and rhythm. "
        "Create an interesting starting scene for a {genre} story set in {setting}. "
        "Describe the world and the character the player will be embodying in a single, engaging paragraph. "
        "Address the player directly as 'You'. Do not ask what they want to do; just set the scene."
    )
)

# Prompt for continuing the story
story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input", "dialect"],
    template=(
        "You are a Dungeon Master continuing an interactive story. The player is the main character. "
        "Your narration must stay in {dialect}, and every response should feel authentic to that dialect. "
        "Your role is to describe the consequences of their actions and the evolving world around them. "
        "Keep your responses grounded in the established story. Don't take actions for the player.\n\n"
        "**Current Situation:**\n{story_so_far}\n\n"
        "**The Player's Action:** {user_input}\n\n"
        "**What happens next?** (Describe it in 2-4 sentences, ending in a way that prompts the player for their next move)."
    )
)

# Character-only response prompt 
character_prompt = PromptTemplate(
    input_variables=["character_name", "story_so_far", "user_input"],
    template=(
        "You are {character_name}, a character in the following story.\n\n"
        "Here is the current story context:\n{story_so_far}\n\n"
        "The user (another character) has said or done:\n{user_input}\n\n"
        "Now respond only as {character_name} would**, staying true to their tone and knowledge.\n"
        "Do not narrate, describe surroundings, or control other characters — just speak as {character_name}.\n"
    )
)

# --- 3. Create Chains ---
setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()
character_chain = character_prompt | llm | StrOutputParser()


# --- 4. Define Backend Functions ---

def start_new_story(genre: str, setting: str, dialect: str) -> str:
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
    if not dialect.strip():
        dialect = random.choice([
            "British English", 
            "American English", 
            "Southern US dialect", 
            "Irish English", 
            "Australian slang"
        ])

    print(f"--- LOG: Starting new story | Genre: {genre}, Setting: {setting}, Dialect: {dialect} ---")
    
    # Generate and return the opening scene
    return setup_chain.invoke({"genre": genre, "setting": setting, "dialect": dialect})


def continue_story(story_so_far: str, user_action: str, dialect: str) -> str:
    """
    Generates the next part of the story based on the current story and the user's action.
    This would be called for every subsequent turn in the game.
    """
    # Basic validation for the user's action
    if not user_action.strip():
        return "You pause for a moment, gathering your thoughts. The world waits for your next move."

    print(f"--- LOG: Continuing story with action: '{user_action}' | Dialect: {dialect}---")
    
    # Generate and return the next story chunk
    return story_chain.invoke({
        "story_so_far": story_so_far,
        "user_input": user_action,
        "dialect": dialect
    })

def character_reply(character_name: str, story: str, user_input: str) -> str:
    """
    Generates an in-character response (AI replies as a specific character only).
    """
    if not character_name.strip():
        return "Error: Character name required."

    print(f"--- LOG: {character_name} responding in-character ---")
    return character_chain.invoke({
        "character_name": character_name,
        "story_so_far": story,
        "user_input": user_input
    })


# --- 5. Main Execution Block ---
# This script is intended to be imported as a module into a web server (e.g., Flask, FastAPI).
# The functions above will be called by your server's API endpoints.
if __name__ == "__main__":
    print("Welcome to the AI Dungeon!\n")

    # Step 1: Gather initial inputs
    genre = input("Enter a genre: ").strip()
    setting = input("Enter a setting: ").strip()
    dialect = input("Enter a dialect/accent: ").strip()

    # Step 2: Generate the opening scene
    story = start_new_story(genre, setting, dialect)
    print("\n--- STORY START ---")
    print(story)
    print("-------------------\n")

    # Step 3: Interactive story loop
    while True:
        user_action = input("What will you do? (type 'quit' to exit): ").strip()

        if user_action.lower() in ["quit", "exit"]:
            print("\n👋 End of the story!")
            break

        # Generate next part of the story
        story = continue_story(story, user_action, dialect)
        print("\n" + story + "\n")
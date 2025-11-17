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

# ------------------------------
# 2. Prompt Templates
# ------------------------------
setup_prompt = PromptTemplate(
    input_variables=["genre", "setting", "dialect"],
    template=(
        "You are a creative AI Dungeon Master speaking in {dialect} and starting a new adventure. "
        "Always write in that dialect’s tone, word choice, and rhythm. "
        "Create an interesting starting scene for a {genre} story set in {setting}. "
        "Describe the world and the character the player will be embodying in a single, engaging paragraph. "
        "Address the player directly as 'You'. Do not ask for an action; just set the scene."
    )
)

story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input", "dialect"],
    template=(
        "You are a Dungeon Master continuing an interactive story. The player is the main character. "
        "Your narration must stay in {dialect}, and every response should feel authentic to that dialect. "
        "Your role is to describe the consequences of their actions and the evolving world around them. "
        "Keep your responses grounded in the established story. Don't take actions for the player.\n\n"
        "**Current Situation:**\n{story_so_far}\n\n"
        "**The Player's Action:** {user_input}\n\n"
        "**What happens next?** Describe it in 2–4 sentences and end with a natural prompt for the player's next move."
    )
)

# ------------------------------
# Multiplayer Prompt Templates
# ------------------------------
setup_prompt_multi = PromptTemplate(
    input_variables=["genre", "setting", "dialect", "players"],
    template=(
        "You are a creative AI Dungeon Master speaking in {dialect} and starting a new "
        "turn-based multiplayer adventure. "
        "You MUST narrate entirely in third-person. Never address any player as 'you'. "
        "Always refer to players by their names: {players}.\n\n"
        "Create an engaging opening scene for a {genre} story set in {setting}. "
        "Introduce the world and briefly describe each player's role. "
        "Do not ask for an action."
    )
)

story_prompt_multi = PromptTemplate(
    input_variables=["story_so_far", "user_input", "dialect"],
    template=(
        "You are a Dungeon Master continuing a turn-based MULTIPLAYER story. "
        "Use third-person narration ONLY. Never speak to the players directly. "
        "Write using the tone and rhythm of {dialect}.\n\n"
        "Current story:\n{story_so_far}\n\n"
        "The latest action taken:\n{user_input}\n\n"
        "Describe the consequences in 3–5 sentences. "
        "End with a moment that sets up the next player's turn."
    )
)


# Chains
setup_chain = setup_prompt | llm | StrOutputParser()
story_chain  = story_prompt  | llm | StrOutputParser()

setup_chain_multi = setup_prompt_multi | llm | StrOutputParser()
story_chain_multi = story_prompt_multi | llm | StrOutputParser()

# ------------------------------
# 3. Story Functions
# ------------------------------
def start_new_story(genre: str, setting: str, dialect: str) -> str:
    if not genre.strip():
        genre = random.choice(["Fantasy", "Cyberpunk", "Cosmic Horror", "Steampunk", "Mystery"])
    if not setting.strip():
        setting = random.choice([
            "a forgotten library containing ancient secrets",
            "a neon-lit alleyway drowning in neon rain",
            "the bridge of a derelict starship drifting through the void"
        ])
    if not dialect.strip():
        dialect = random.choice([
            "British English", "American English", "Southern US dialect",
            "Irish English", "Australian slang"
        ])

    print(f"\n--- LOG: Starting new story | {genre=} {setting=} {dialect=} ---\n")
    return setup_chain.invoke({"genre": genre, "setting": setting, "dialect": dialect})


def continue_story(story_so_far: str, user_action: str, dialect: str) -> str:
    if not user_action.strip():
        return "You pause briefly, unsure of your next step. The world holds its breath."

    print(f"\n--- LOG: Continuing story | action='{user_action}' | dialect='{dialect}' ---\n")

    return story_chain.invoke({
        "story_so_far": story_so_far,
        "user_input": user_action,
        "dialect": dialect
    })


# ------------------------------
# 4. Terminal Game Loop (Single or Multi-Player)
# ------------------------------
def single_player_mode():
    print("\n=== Single Player Mode ===")
    genre = input("Genre: ")
    setting = input("Setting: ")
    dialect = input("Dialect/Accent: ")

    story = start_new_story(genre, setting, dialect)
    print("\n--- STORY START ---")
    print(story)
    print("-------------------\n")

    while True:
        action = input("What will you do? ('quit' to exit): ")
        if action.lower() in ("quit", "exit"):
            print("\n👋 Story ended.")
            break

        story = continue_story(story, action, dialect)
        print("\n" + story + "\n")

def introduce_new_player(story_so_far: str, new_player: str, dialect: str) -> str:
    """
    Tells the LLM to introduce a new player mid-story.
    Uses multiplayer rules: third-person narration only.
    """
    intro_prompt = PromptTemplate(
        input_variables=["story_so_far", "new_player", "dialect"],
        template=(
            "You are a Dungeon Master continuing a MULTIPLAYER story. "
            "A new player has joined mid-adventure.\n\n"
            "Current story:\n{story_so_far}\n\n"
            "Introduce the new player named {new_player} in a natural and immersive way. "
            "Stay in third-person and keep the narration consistent with {dialect}. "
            "Describe how they enter the scene and their role. "
            "Do not ask for an action."
        )
    )

    chain = intro_prompt | llm | StrOutputParser()

    return chain.invoke({
        "story_so_far": story_so_far,
        "new_player": new_player,
        "dialect": dialect
    })

def multiplayer_mode():
    print("\n=== Turn-Based Multiplayer Mode ===")

    num = int(input("How many players? "))
    players = [input(f"Player {i+1} name: ") for i in range(num)]
    players_str = ", ".join(players)

    genre = input("Genre: ")
    setting = input("Setting: ")
    dialect = input("Dialect/Accent: ")

    # Use multiplayer-specific setup chain
    story = setup_chain_multi.invoke({
        "genre": genre,
        "setting": setting,
        "dialect": dialect,
        "players": players_str
    })

    print("\n--- STORY START ---")
    print(story)
    print("-------------------\n")

    turn = 0
    while True:
        current_player = players[turn % len(players)]
        print(f"\n🎮 {current_player}'s turn")

        action = input(f"{current_player}, what do you do? ('quit' to exit, 'add' to add player): ")

        # ----------------------------
        # ADD PLAYER MID-GAME FEATURE
        # ----------------------------
        if action.lower() == "add":
            new_player = input("Enter new player's name: ").strip()
            if not new_player:
                print("Invalid name.")
                continue

            players.append(new_player)
            print(f"✅ Added player: {new_player}")

            # Introduce them in the story
            story = introduce_new_player(story, new_player, dialect)

            print("\n" + story + "\n")

            # IMPORTANT: do NOT increment turn, current player plays again
            continue

        # ----------------------------
        # QUIT GAME
        # ----------------------------
        if action.lower() in ("quit", "exit"):
            print("\n👋 Story ended.")
            break

        # ----------------------------
        # NORMAL ACTION
        # ----------------------------
        tagged_action = f"{current_player} decides to {action}"

        story = story_chain_multi.invoke({
            "story_so_far": story,
            "user_input": tagged_action,
            "dialect": dialect
        })

        print("\n" + story + "\n")
        turn += 1




# ------------------------------
# 5. Run Terminal App
# ------------------------------
if __name__ == "__main__":
    print("=== AI Storyteller ===")
    print("1. Single Player")
    print("2. Turn-Based Multiplayer")

    mode = input("\nChoose mode (1/2): ").strip()

    if mode == "1":
        single_player_mode()
    elif mode == "2":
        multiplayer_mode()
    else:
        print("Invalid option.")

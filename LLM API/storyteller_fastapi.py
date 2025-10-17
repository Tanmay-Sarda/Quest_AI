# storyteller_fastapi.py
import os
import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
import motor.motor_asyncio  # Async MongoDB client

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

import os # This should already be there
from dotenv import load_dotenv

load_dotenv()

# --- 1. FastAPI Setup ---
app = FastAPI(title="AI Storyteller API")

# --- 2. MongoDB Setup (Async) ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["story_db"]
story_collection = db["stories"]

# --- 3. LLM Initialization ---
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.9,
    google_api_key=os.environ.get("GOOGLE_API_KEY")
)

# --- 4. Prompt Templates ---
setup_prompt = PromptTemplate(
    input_variables=["genre", "setting"],
    template=(
        "You are a creative AI Dungeon Master starting a new adventure. "
        "Create an interesting starting scene for a {genre} story set in {setting}. "
        "Describe the world and the character the player will be embodying in a single, engaging paragraph. "
        "Address the player directly as 'You'. Do not ask what they want to do; just set the scene."
    )
)

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

setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()

# --- 5. Pydantic Models for Request/Response ---
class Owner(BaseModel):
    owner: str  # User ObjectId as string
    character: str

class ContentItem(BaseModel):
    prompt: str
    user: str
    response: str

class NewStoryRequest(BaseModel):
    name: str
    description: str
    genre: Optional[str] = ""
    setting: Optional[str] = ""
    owner: Owner
    public: Optional[bool] = False

class ContinueStoryRequest(BaseModel):
    story_id: str
    user_id: str
    user_action: str

class StoryResponse(BaseModel):
    story_id: str
    content: List[ContentItem]
    complete: bool
    public: bool

# --- 6. Helper Functions ---
def generate_random_genre():
    return random.choice(["Fantasy", "Cyberpunk", "Cosmic Horror", "Steampunk", "Mystery"])

def generate_random_setting():
    return random.choice([
        "a forgotten library containing ancient secrets",
        "a neon-drenched alleyway in a city that never sleeps",
        "the bridge of a derelict starship drifting through the void"
    ])

# --- 7. API Endpoints ---
@app.post("/story/new", response_model=StoryResponse)
async def start_new_story(request: NewStoryRequest):
    genre = request.genre.strip() or generate_random_genre()
    setting = request.setting.strip() or generate_random_setting()

    # Generate initial scene
    initial_scene = setup_chain.invoke({"genre": genre, "setting": setting})

    # Prepare story document
    story_doc = {
        "name": request.name,
        "description": request.description,
        "ownerid": [{"owner": ObjectId(request.owner.owner), "character": request.owner.character}],
        "content": [{
            "prompt": f"Starting scene for {genre} in {setting}",
            "user": ObjectId(request.owner.owner),
            "response": initial_scene
        }],
        "complete": False,
        "public": request.public
    }

    # Insert into MongoDB
    result = await story_collection.insert_one(story_doc)
    story_doc["_id"] = str(result.inserted_id)
    story_doc["content"][0]["user"] = str(story_doc["content"][0]["user"])
    return {
        "story_id": story_doc["_id"],
        "content": story_doc["content"],
        "complete": story_doc["complete"],
        "public": story_doc["public"]
    }

@app.post("/story/continue", response_model=StoryResponse)
async def continue_story_api(request: ContinueStoryRequest):
    story = await story_collection.find_one({"_id": ObjectId(request.story_id)})
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    # Build the story so far
    story_so_far = "\n".join([c["response"] for c in story.get("content", [])])

    # Generate next part
    next_scene = story_chain.invoke({"story_so_far": story_so_far, "user_input": request.user_action})

    # Append to MongoDB
    new_content = {
        "prompt": request.user_action,
        "user": ObjectId(request.user_id),
        "response": next_scene
    }
    await story_collection.update_one(
        {"_id": ObjectId(request.story_id)},
        {"$push": {"content": new_content}}
    )

    # Return updated story
    story = await story_collection.find_one({"_id": ObjectId(request.story_id)})
    for c in story["content"]:
        c["user"] = str(c["user"])
    story["_id"] = str(story["_id"])
    return {
        "story_id": story["_id"],
        "content": story["content"],
        "complete": story["complete"],
        "public": story["public"]
    }

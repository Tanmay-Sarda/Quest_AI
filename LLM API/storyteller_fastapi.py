# storyteller_fastapi.py
import os
import random
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
import motor.motor_asyncio

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

# --- FastAPI Setup ---
app = FastAPI(title="AI Storyteller API")

# --- MongoDB Setup (FIXED: Connect to 'test' database) ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["test"]  # Changed from "story_db" to "test"
story_collection = db["stories"]

llm = ChatGroq(
    model="llama-3.3-70b-versatile", 
    temperature=0.9,
    groq_api_key=os.environ.get("GROQ_API_KEY")
)

# --- Prompt Templates ---
setup_prompt = PromptTemplate(
    input_variables=["title", "description", "character"],
    template=(
        "You are a creative AI Dungeon Master starting a new adventure. "
        "Story Title: {title}\n"
        "Story Description: {description}\n"
        "Main Character: {character}\n\n"
        "Create an engaging opening scene for this story. "
        "Describe the world and introduce the character '{character}' in a compelling way. "
        "Address the player directly as 'You'. Keep it to 2-4 paragraphs. "
        "End with a situation that prompts action."
    )
)

story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input", "character"],
    template=(
        "You are a Dungeon Master continuing an interactive story. "
        "The player is '{character}', the main character. "
        "Describe the consequences of their actions and the evolving world. "
        "Keep responses grounded in the established story. Don't take actions for the player.\n\n"
        "**Story So Far:**\n{story_so_far}\n\n"
        "**{character}'s Action:** {user_input}\n\n"
        "**What happens next?** (2-4 sentences, ending with a prompt for the next move)"
    )
)

setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()

# --- Pydantic Models  ---
class Owner(BaseModel):
    owner: str
    character: str

class NewStoryRequest(BaseModel):
    name: str  
    description: str
    owner: Owner

class ContinueStoryRequest(BaseModel):
    story_id: str
    user_id: str
    user_action: str

class ContentItem(BaseModel):
    prompt: str
    user: str
    response: str

class StoryResponse(BaseModel):
    story_id: str
    title: str
    description: str
    character: str
    content: List[ContentItem]
    complete: bool

# --- API Endpoints ---
@app.post("/story/new")
async def start_new_story(request: NewStoryRequest):
    """Generate initial story content and return it (Node.js will save to DB)"""
    try:
        # Generate initial scene using title, description, and character
        initial_scene = setup_chain.invoke({
            "title": request.name,
            "description": request.description,
            "character": request.owner.character
        })

        # Return just the generated content
        # Node.js controller will handle saving to MongoDB
        return {
            "content": initial_scene,
            "character": request.owner.character
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")


@app.post("/story/continue")
async def continue_story_api(request: ContinueStoryRequest):
    """Continue existing story and update MongoDB in 'test' database"""
    try:
        # Fetch story from 'test' database
        story = await story_collection.find_one({"_id": ObjectId(request.story_id)})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # Find the user's character name
        character = None
        for owner_entry in story.get("ownerid", []):
            if str(owner_entry.get("owner")) == request.user_id:
                character = owner_entry.get("character")
                break
        

        # Build story context from content array
        story_so_far = "\n".join([
            f"{c.get('prompt', 'Scene')}: {c.get('response', '')}" 
            for c in story.get("content", [])
        ])

        # Generate next scene
        next_scene = story_chain.invoke({
            "story_so_far": story_so_far,
            "user_input": request.user_action,
            "character": character
        })

        # Append to MongoDB in 'test' database
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
        updated_story = await story_collection.find_one({"_id": ObjectId(request.story_id)})
        
        # Format response
        content_list = []
        for c in updated_story.get("content", []):
            content_list.append({
                "prompt": c.get("prompt", ""),
                "user": str(c.get("user", "")),
                "response": c.get("response", "")
            })

        return {
            "story_id": str(updated_story["_id"]),
            "title": updated_story.get("title", ""),
            "description": updated_story.get("description", ""),
            "character": character,
            "content": content_list,
            "complete": updated_story.get("complete", False)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error continuing story: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "test"}
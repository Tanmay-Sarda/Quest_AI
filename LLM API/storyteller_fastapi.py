import os
import random
import traceback
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
import motor.motor_asyncio

from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

# --- FastAPI Setup ---
app = FastAPI(title="AI Storyteller API")

# --- MongoDB Setup ---
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client["test"]
story_collection = db["stories"]

# --- LLM Setup ---
llm = ChatGroq(
    model="llama3-70b-8192",  # Use a current, supported model
    temperature=0.9,
    groq_api_key=os.environ.get("GROQ_API_KEY")
)

# --- Prompt Templates ---

# 1. NEW Dialect Generation Prompt
dialect_prompt = PromptTemplate(
    input_variables=["description"],
    template=(
        "You are a linguistic expert. Analyze the following story description and determine the most fitting narrator dialect. "
        "Your response must be ONLY the name of the dialect (e.g., 'British English', '1920s hard-boiled detective', 'Cyberpunk street slang'). "
        "Do not add any preamble or explanation.\n\n"
        "Story Description: {description}\n\n"
        "Appropriate Dialect:"
    )
)

# 2. Story Setup Prompt (uses the generated dialect)
setup_prompt = PromptTemplate(
    input_variables=["title", "description", "character", "dialect"],
    template=(
        "You are a creative AI Dungeon Master speaking in {dialect} and starting a new adventure. "
        "Always write in that dialect’s tone, word choice, and rhythm. "
        "Story Title: {title}\n"
        "Story Description: {description}\n"
        "Main Character: {character}\n\n"
        "Create an engaging opening scene for this story. "
        "Describe the world and introduce the character '{character}' in a compelling way. "
        "Address the player directly as 'You'. Keep it to 2-4 paragraphs. "
        "End with a situation that prompts action."
    )
)

# 3. Story Continuation Prompt (uses the saved dialect)
story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input", "character", "dialect"],
    template=(
        "You are a Dungeon Master continuing an interactive story, speaking in {dialect}. "
        "Your narration must stay in {dialect}, and every response should feel authentic to that dialect. "
        "The player is '{character}', the main character. "
        "Describe the consequences of their actions and the evolving world. "
        "Keep responses grounded in the established story. Don't take actions for the player.\n\n"
        "**Story So Far:**\n{story_so_far}\n\n"
        "**{character}'s Action:** {user_input}\n\n"
        "**What happens next?** (2-4 sentences, ending with a prompt for the next move)"
    )
)

# --- Chains ---
dialect_chain = dialect_prompt | llm | StrOutputParser()
setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()


# --- Pydantic Models ---
class Owner(BaseModel):
    owner: str
    character: str

class NewStoryRequest(BaseModel):
    name: str
    description: str
    owner: Owner
    # Dialect is no longer sent by the client

class ContinueStoryRequest(BaseModel):
    story_id: str
    user_id: str
    user_action: str

# ... (other models like ContentItem, StoryResponse) ...


# --- API Endpoints ---
@app.post("/story/new")
async def start_new_story(request: NewStoryRequest):
    """Generate initial story content AND dialect"""
    try:
        # 1. Call the new dialect_chain first
        dialect = dialect_chain.invoke({
            "description": request.description
        })
        dialect = dialect.strip().strip('""') # Clean up output
        print(f"--- LOG: Generated dialect: {dialect} ---")
        
        # 2. Generate initial scene using the new dialect
        initial_scene = setup_chain.invoke({
            "title": request.name,
            "description": request.description,
            "character": request.owner.character,
            "dialect": dialect  # Use the generated dialect
        })

        # 3. Return content AND dialect
        return {
            "content": initial_scene,
            "character": request.owner.character,
            "dialect": dialect  # Return dialect so Node.js can save it
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")


@app.post("/story/continue")
async def continue_story_api(request: ContinueStoryRequest):
    """Continue existing story and update MongoDB in 'test' database"""
    try:
        # --- 1. Validate Story ID ---
        try:
            story_oid = ObjectId(request.story_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid story_id format: {request.story_id}")
        
        # --- 2. Validate User ID ---
        try:
            user_oid = ObjectId(request.user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid user_id format: {request.user_id}")

        # --- 3. Fetch story from 'test' database ---
        story = await story_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # --- 4. Find the user's character name ---
        character = None
        for owner_entry in story.get("ownerid", []):
            if str(owner_entry.get("owner")) == request.user_id:
                character = owner_entry.get("character")
                break
        
        # --- 5. Get the dialect from the saved story ---
        dialect = story.get("dialect", "American English") # Default if not found

        # --- 6. Build story context from content array ---
        story_so_far = "\n".join([  # <-- This is the 'join' fix
            f"{c.get('prompt', 'Scene')}: {c.get('response', '')}" 
            for c in story.get("content", [])
        ])

        # --- 7. Generate next scene ---
        next_scene = story_chain.invoke({
            "story_so_far": story_so_far,
            "user_input": request.user_action,
            "character": character,
            "dialect": dialect
        })

        # --- 8. Append to MongoDB in 'test' database ---
        new_content = {
            "prompt": request.user_action,
            "user": user_oid, # Use the validated user_oid
            "response": next_scene
        }
        
        await story_collection.update_one(
            {"_id": story_oid}, # Use the validated story_oid
            {"$push": {"content": new_content}}
        )

        # --- 9. Return updated story ---
        updated_story = await story_collection.find_one({"_id": story_oid})
        
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
            "complete": updated_story.get("complete", False),
            "dialect": dialect
        }
    
    except HTTPException:
        raise # Re-raise known errors (like 400s and 404s)
    
    except Exception as e:
        # --- This will catch all other crashes ---
        print(f"--- UNHANDLED ERROR IN /story/continue ---")
        traceback.print_exc() # This prints the full error to your console
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "test"}
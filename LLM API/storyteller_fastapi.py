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

summary_prompt = PromptTemplate(
    input_variables=["existing_summary", "new_chunk"],
    template=(
        "You are a story summarizer. Condense the following 'New Story Chunk' into the 'Existing Summary' "
        "while preserving key events, characters, and plot points. The result should be a single, coherent summary. "
        "Keep the tone of the original story. If the existing summary is empty, just summarize the new chunk.\n\n"
        "**Existing Summary:**\n{existing_summary}\n\n"
        "**New Story Chunk to Add:**\n{new_chunk}\n\n"
        "**Updated, Coherent Summary:**"
    )
)

# --- Chains ---
dialect_chain = dialect_prompt | llm | StrOutputParser()
setup_chain = setup_prompt | llm | StrOutputParser()
story_chain = story_prompt | llm | StrOutputParser()
summary_chain = summary_prompt | llm | StrOutputParser()

# --- Helper Function ---
def format_story_chunk(content_list: List[dict]) -> str:
    """Helper to format a list of content dicts into a string."""
    return "\n".join([
        f"{c.get('prompt', 'Scene')}: {c.get('response', '')}"
        for c in content_list
    ])


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
    """Continue existing story, summarize if needed, and update MongoDB."""
    try:
        # --- 1. & 2. Validate IDs ---
        try:
            story_oid = ObjectId(request.story_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid story_id format: {request.story_id}")
    
        try:
            user_oid = ObjectId(request.user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid user_id format: {request.user_id}")

        # --- 3. Fetch story ---
        story = await story_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

        # --- 4. & 5. Get Character and Dialect ---
        character = None
        for owner_entry in story.get("ownerid", []):
            if str(owner_entry.get("owner")) == request.user_id:
                character = owner_entry.get("character")
                break
        
        dialect = story.get("dialect", "American English")

        # --- 6. NEW: Context Management & Summarization ---
        
        # Define context limits
        MAX_RECENT_CONTEXT_TURNS = 15 # Keep 15 turns in full detail
        TURNS_TO_TRIGGER_SUMMARY = 10 # "Roll up" 10 turns when we exceed 15

        existing_summary = story.get("summary", "") # Get summary (or "" if new)
        recent_content_list = story.get("content", [])
        
        # Check if context is too long and needs summarization
        if len(recent_content_list) > MAX_RECENT_CONTEXT_TURNS:
            print(f"--- LOG: Context limit ({MAX_RECENT_CONTEXT_TURNS}) exceeded. Summarizing... ---")
            
            # 1. Split the content
            turns_to_summarize = recent_content_list[:TURNS_TO_TRIGGER_SUMMARY]
            remaining_recent_content = recent_content_list[TURNS_TO_TRIGGER_SUMMARY:]
            
            # 2. Format the chunk to be summarized
            formatted_chunk = format_story_chunk(turns_to_summarize)
            
            # 3. Call summarizer chain (ASYNC)
            new_summary = await summary_chain.ainvoke({
                "existing_summary": existing_summary,
                "new_chunk": formatted_chunk
            })
            
            # 4. Update local variables for this turn
            existing_summary = new_summary.strip()
            recent_content_list = remaining_recent_content # We'll use this to build context
            
            # 5. Update the database with the new summary and trimmed content list
            await story_collection.update_one(
                {"_id": story_oid},
                {
                    "$set": {
                        "summary": existing_summary,
                        "content": remaining_recent_content # Save the *trimmed* content list
                    }
                }
            )
            print("--- LOG: Summarization complete. DB updated. ---")

        # --- 7. Build story context (NOW uses summary + recent) ---
        formatted_recent_content = format_story_chunk(recent_content_list)
        
        # Combine summary and recent events for the final context
        story_so_far = ""
        if existing_summary:
            story_so_far += f"**Story Summary So Far:**\n{existing_summary}\n\n"
        
        story_so_far += f"**Recent Events:**\n{formatted_recent_content}"

        # --- 8. Generate next scene (using await .ainvoke) ---
        next_scene = await story_chain.ainvoke({
            "story_so_far": story_so_far,
            "user_input": request.user_action,
            "character": character,
            "dialect": dialect
        })

        # --- 9. Append new action+response to MongoDB ---
        new_content = {
            "prompt": request.user_action,
            "user": user_oid,
            "response": next_scene
        }
        
        await story_collection.update_one(
            {"_id": story_oid},
            {"$push": {"content": new_content}}
        )

        # --- 10. Return updated story ---
        # Fetch the *final* state of the story after all updates
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
            "content": content_list, # This is now just the recent content
            "summary": updated_story.get("summary", ""), # Also return the summary
            "complete": updated_story.get("complete", False),
            "dialect": dialect
        }
    
    except HTTPException:
        raise # Re-raise known errors (like 400s and 404s)
    
    except Exception as e:
        print(f"--- UNHANDLED ERROR IN /story/continue ---")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "test"}
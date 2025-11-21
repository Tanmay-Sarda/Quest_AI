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
    input_variables=["title", "description", "character", "dialect", "genre"],
    template=(
        "You are a creative AI Dungeon Master speaking in {dialect} and starting a new adventure. "
        "Always write in that dialect's tone, word choice, and rhythm. "
        "Story Title: {title}\n"
        "Story Genre: {genre}\n"
        "Story Description: {description}\n"
        "Main Character: {character}\n\n"
        "Create an engaging opening scene for this {genre} story. "
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
    genre: Optional[str] = None
    api_key: str

class ContinueStoryRequest(BaseModel):
    story_id: str
    user_id: str
    user_action: str
    api_key: str



# --- API Endpoints ---
@app.post("/story/new")
async def start_new_story(request: NewStoryRequest):
    """Non-streaming version (backward compatible)"""
    try:
        llm = ChatGroq(
            model="moonshotai/kimi-k2-instruct",
            temperature=0.9,
            groq_api_key=request.api_key
        )
        dialect_chain = dialect_prompt | llm | StrOutputParser()
        setup_chain = setup_prompt | llm | StrOutputParser()

        dialect = dialect_chain.invoke({
            "description": request.description
        })
        dialect = dialect.strip().strip('""')
        print(f"--- LOG: Generated dialect: {dialect} ---")
        
        initial_scene = setup_chain.invoke({
            "title": request.name,
            "description": request.description,
            "character": request.owner.character,
            "dialect": dialect,
            "genre": request.genre or "adventure"
        })

        return {
            "content": initial_scene,
            "character": request.owner.character,
            "dialect": dialect
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating story: {str(e)}")


@app.post("/story/continue")
async def continue_story_api(request: ContinueStoryRequest):
    try:
        llm = ChatGroq(
            model="moonshotai/kimi-k2-instruct",
            temperature=0.9,
            groq_api_key=request.api_key
        )
        story_chain = story_prompt | llm | StrOutputParser()
        summary_chain = summary_prompt | llm | StrOutputParser()

        try:
            story_oid = ObjectId(request.story_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid story_id format: {request.story_id}")
    
        try:
            user_oid = ObjectId(request.user_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Invalid user_id format: {request.user_id}")

        story = await story_collection.find_one({"_id": story_oid})
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")

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

        existing_summary = story.get("summary", "")
        recent_content_list = story.get("content", [])
        
        # Check if context is too long and needs summarization
        if len(recent_content_list) > MAX_RECENT_CONTEXT_TURNS:
            print(f"--- LOG: Context limit ({MAX_RECENT_CONTEXT_TURNS}) exceeded. Summarizing... ---")
            
            turns_to_summarize = recent_content_list[:TURNS_TO_TRIGGER_SUMMARY]
            remaining_recent_content = recent_content_list[TURNS_TO_TRIGGER_SUMMARY:]
            
            formatted_chunk = format_story_chunk(turns_to_summarize)
            
            #  Call summarizer chain (ASYNC)
            new_summary = await summary_chain.ainvoke({
                "existing_summary": existing_summary,
                "new_chunk": formatted_chunk
            })
            
            existing_summary = new_summary.strip()
            recent_content_list = remaining_recent_content # We'll use this to build context
            
            await story_collection.update_one(
                {"_id": story_oid},
                {
                    "$set": {
                        "summary": existing_summary,
                        "content": remaining_recent_content
                    }
                }
            )
            print("--- LOG: Summarization complete. DB updated. ---")

        formatted_recent_content = format_story_chunk(recent_content_list)
        
        # Combine summary and recent events for the final context
        story_so_far = ""
        if existing_summary:
            story_so_far += f"**Story Summary So Far:**\n{existing_summary}\n\n"
        
        story_so_far += f"**Recent Events:**\n{formatted_recent_content}"

        next_scene = await story_chain.ainvoke({
            "story_so_far": story_so_far,
            "user_input": request.user_action,
            "character": character,
            "dialect": dialect
        })

        new_content = {
            "prompt": request.user_action,
            "user": user_oid,
            "response": next_scene
        }
        
        await story_collection.update_one(
            {"_id": story_oid},
            {"$push": {"content": new_content}}
        )

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
            "summary": updated_story.get("summary", ""),
            "complete": updated_story.get("complete", False),
            "dialect": dialect
        }
    
    except HTTPException:
        raise
    
    except Exception as e:
        print(f"--- UNHANDLED ERROR IN /story/continue ---")
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
    
@app.get("/health")
async def health_check():
    return {"status": "healthy", "database": "test"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
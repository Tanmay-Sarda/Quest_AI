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

# 1. Improved Dialect Generation Prompt - Now detects if it's fanfic and extracts source style
dialect_prompt = PromptTemplate(
    input_variables=["description"],
    template=(
        "Analyze this story description.\n\n"
        "Description: {description}\n\n"
        "If FANFICTION (references existing work/character/universe):\n"
        "FANFIC: [Source] | STYLE: [50 words max: narrative voice (1st/3rd person), sentence style (short/medium/long), tone, pacing, key patterns]\n\n"
        "If ORIGINAL story:\n"
        "ORIGINAL: [5-8 words describing tone and style]\n\n"
        "Examples:\n"
        "- FANFIC: Stormlight Archive | STYLE: Third-person limited, epic fantasy tone, medium-long sentences with internal monologue, philosophical themes, detailed magic system explanations, character-driven pacing\n"
        "- ORIGINAL: gritty noir with cynical edge\n\n"
        "Be accurate and concise."
    )
)

# 2. Improved Story Setup Prompt - Handles both original and fanfic
setup_prompt = PromptTemplate(
    input_variables=["title", "description", "character", "dialect", "genre"],
    template=(
        "You are a masterful storyteller creating a {genre} story.\n\n"
        "Story Title: {title}\n"
        "Description: {description}\n"
        "Protagonist: {character}\n"
        "Style Guide: {dialect}\n\n"
        "CRITICAL INSTRUCTIONS:\n"
        "• If the Style Guide mentions 'FANFIC' or references a source material, you MUST match that source's writing style precisely (narrative voice, sentence structure, tone, pacing, signature elements)\n"
        "• If it's an original story, use the style descriptor as a guide for atmosphere and tone\n"
        "• Focus on immersive sensory details (sights, sounds, textures, scents). try to use metaphors that are good and common.\n"
        "• Use 'show don't tell' - reveal through action and detail, not exposition\n\n"
        "• IMPORTANT - Introduce '{character}' with clear personality, motivation and background\n\n"
        "• Address the player as second or third person depending on context naturally\n"
        "End with a situation that demands choice or action naturally, without asking 'What do you do?'\n\n"
        "REMEMBER: If this is fanfiction, it must sound like it was written by the original creator."
    )
)

# 3. Improved Story Continuation Prompt - Maintains style consistency
story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input", "character", "dialect"],
    template=(
        "Continue this story where {character} is the protagonist.\n\n"
        "Style: {dialect}\n\n"
        "CONTEXT:\n{story_so_far}\n\n"
        "PLAYER ACTION: {user_input}\n\n"
        "WRITING RULES:\n"
        "• If Style mentions 'FANFIC', maintain that source's writing style, but don't be TOO fancy.\n"
        "• Write 2-3 SHORT paragraphs (3-5 sentences each) Use paragraph breaks in the form of '\\n\\n'..\n"
        "• Use prose fitting the TONE AND ORIGINAL DIALECT of the story.\n\n"
        "• ORIGINAL CANON RULES AND LORE STILL APLLY IN FANFICS.\n\n"
        "• Describe what happens as a result of the action.\n"
        "• Show environmental reactions and consequences.\n"
        "• NEVER decide what {character} thinks or does next.\n"
        "• Keep player agency - only narrate the world's response.\n"
        "• End at a natural pause, not with questions or prompts.\n\n"
        "Write ONLY the narrative continuation. No meta-commentary or * or ----."
    )
)

# 4. Improved Summary Prompt
summary_prompt = PromptTemplate(
    input_variables=["existing_summary", "new_chunk"],
    template=(
        "You are condensing a story while preserving its essence.\n\n"
        "EXISTING SUMMARY:\n{existing_summary}\n\n"
        "NEW EVENTS TO INTEGRATE:\n{new_chunk}\n\n"
        "Create an updated summary that:\n"
        "• Preserves all major plot points, character developments, and revelations\n"
        "• Maintains chronological order and cause-effect relationships\n"
        "• Captures tone and atmosphere\n"
        "• Highlights key decisions and their consequences\n"
        "• Stays concise but rich in detail\n\n"
        "If existing summary is empty, summarize only the new chunk. "
        "Write in past tense, third person. Keep under 300 words.\n\n"
        "UPDATED SUMMARY:"
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
            model="llama-3.3-70b-versatile",
            temperature=0.9,
            groq_api_key=request.api_key
        )
        dialect_chain = dialect_prompt | llm | StrOutputParser()
        setup_chain = setup_prompt | llm | StrOutputParser()

        # Generate style/dialect (now handles fanfic detection automatically)
        dialect = dialect_chain.invoke({
            "description": request.description
        })
        dialect = dialect.strip().strip('""')
        print(f"--- LOG: Generated dialect/style: {dialect} ---")
        
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

        # --- Context Management & Summarization ---
        
        MAX_RECENT_CONTEXT_TURNS = 15
        TURNS_TO_TRIGGER_SUMMARY = 10

        existing_summary = story.get("summary", "")
        recent_content_list = story.get("content", [])
        
        # Check if context needs summarization
        if len(recent_content_list) > MAX_RECENT_CONTEXT_TURNS:
            print(f"--- LOG: Context limit ({MAX_RECENT_CONTEXT_TURNS}) exceeded. Summarizing... ---")
            
            turns_to_summarize = recent_content_list[:TURNS_TO_TRIGGER_SUMMARY]
            remaining_recent_content = recent_content_list[TURNS_TO_TRIGGER_SUMMARY:]
            
            formatted_chunk = format_story_chunk(turns_to_summarize)
            
            new_summary = await summary_chain.ainvoke({
                "existing_summary": existing_summary,
                "new_chunk": formatted_chunk
            })
            
            existing_summary = new_summary.strip()
            recent_content_list = remaining_recent_content
            
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
        
        # Combine summary and recent events
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
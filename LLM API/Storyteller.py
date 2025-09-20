from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

# --- 1. Initialize LLM (using Gemini) ---
llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.8,
    google_api_key="Google-API-Key"  # Replace with env variable or direct key
)

# --- 2. Define Prompt Template ---
story_prompt = PromptTemplate(
    input_variables=["story_so_far", "user_input"],
    template=(
        "You are a creative storyteller. The story must be interactive and should not end "
        "unless the user clearly says so.\n\n"
        "Here is the story so far:\n{story_so_far}\n\n"
        "The user adds: {user_input}\n\n"
        "Continue the story naturally in 3-5 sentences. "
        "Do not conclude the story yet."
    )
)

# --- 3. Create Chain ---
story_chain = story_prompt | llm | StrOutputParser()

# --- 4. Run Interactive Storytelling Loop ---
def interactive_storytelling():
    story_so_far = "Once upon a time..."
    print("\nInteractive Storytelling Started!\n")
    print(story_so_far)

    while True:
        user_input = input("\nEnter your next prompt (or type 'END' to finish): ")
        if user_input.strip().upper() == "END":
            print("\nStorytelling session ended. Thanks for playing!\n")

            # --- Save the story to a text file ---
            with open("story_output.txt", "w", encoding="utf-8") as f:
                f.write(story_so_far)

            print("Full story saved as 'story_output.txt'\n")
            break

        # Generate next part of the story
        story_chunk = story_chain.invoke({
            "story_so_far": story_so_far,
            "user_input": user_input
        })

        # Update story so far
        story_so_far += " " + story_chunk

        # Print only the new continuation
        print("\n" + story_chunk)

# --- 5. Run the Application ---
if __name__ == "__main__":
    interactive_storytelling()

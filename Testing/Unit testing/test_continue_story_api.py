import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId
from fastapi import HTTPException

from storyteller_fastapi import continue_story_api, ContinueStoryRequest

@pytest.mark.asyncio
class TestContinueStoryApi:
    # --- HAPPY PATHS ---

    @pytest.mark.happy_path
    async def test_continue_story_happy_path_basic(self):
        """
        Test that continue_story_api returns correct response for a valid request with typical story data.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        user_action = "I open the mysterious door."
        character = "Alice"
        dialect = "British English"
        story_title = "The Haunted Manor"
        story_description = "A spooky adventure."
        summary = "Alice entered the manor."
        content = [
            {"prompt": "Look around", "user": ObjectId(), "response": "You see cobwebs."},
            {"prompt": "Call out", "user": ObjectId(), "response": "Your voice echoes."}
        ]
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        updated_content = content + [{
            "prompt": user_action,
            "user": ObjectId(user_id),
            "response": "The door creaks open, revealing darkness."
        }]

        # Patch DB and LLM
        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            # find_one returns the story
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": story_title,
                    "description": story_description,
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "summary": summary,
                    "content": content,
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": story_title,
                    "description": story_description,
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "summary": summary,
                    "content": updated_content,
                    "complete": False
                }
            ])
            # update_one is a dummy async
            mock_collection.update_one = AsyncMock()
            # story_chain.ainvoke returns the next scene
            mock_story_chain.ainvoke = AsyncMock(return_value="The door creaks open, revealing darkness.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action=user_action
            )
            result = await continue_story_api(req)

            assert result["story_id"] == story_id
            assert result["title"] == story_title
            assert result["description"] == story_description
            assert result["character"] == character
            assert result["summary"] == summary
            assert result["dialect"] == dialect
            assert result["complete"] is False
            # Last content should match the new action/response
            assert result["content"][-1]["prompt"] == user_action
            assert result["content"][-1]["response"] == "The door creaks open, revealing darkness."
            assert result["content"][-1]["user"] == user_id

    @pytest.mark.happy_path
    async def test_continue_story_with_context_summarization(self):
        """
        Test that context summarization is triggered when content exceeds MAX_RECENT_CONTEXT_TURNS.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Bob"
        dialect = "Cyberpunk"
        summary = "Bob started his journey."
        # 16 turns triggers summarization (MAX_RECENT_CONTEXT_TURNS=15)
        content = [
            {"prompt": f"Action {i}", "user": ObjectId(), "response": f"Response {i}"} for i in range(16)
        ]
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        # After summarization, first 10 turns are summarized, 6 remain
        remaining_content = content[10:]
        new_summary = "Bob started his journey. Many things happened."
        user_action = "Hack the terminal."
        updated_content = remaining_content + [{
            "prompt": user_action,
            "user": ObjectId(user_id),
            "response": "You hack the terminal and alarms blare."
        }]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain, \
             patch("storyteller_fastapi.summary_chain") as mock_summary_chain:
            # find_one: first for original, second for updated
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Cyber Heist",
                    "description": "A neon-lit adventure.",
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "summary": summary,
                    "content": content,
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Cyber Heist",
                    "description": "A neon-lit adventure.",
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "summary": new_summary,
                    "content": updated_content,
                    "complete": False
                }
            ])
            mock_collection.update_one = AsyncMock()
            mock_summary_chain.ainvoke = AsyncMock(return_value=new_summary)
            mock_story_chain.ainvoke = AsyncMock(return_value="You hack the terminal and alarms blare.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action=user_action
            )
            result = await continue_story_api(req)

            # Check that summary was updated
            assert result["summary"] == new_summary
            # Check that only the last 7 content entries remain (6 + new)
            assert len(result["content"]) == 7
            assert result["content"][-1]["prompt"] == user_action
            assert result["content"][-1]["response"] == "You hack the terminal and alarms blare."

    @pytest.mark.happy_path
    async def test_continue_story_with_no_existing_summary(self):
        """
        Test that continue_story_api works when the story has no existing summary.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Eve"
        dialect = "1920s hard-boiled detective"
        content = [
            {"prompt": "Knock on the door", "user": ObjectId(), "response": "A gruff voice answers."}
        ]
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        user_action = "Ask about the missing person."
        updated_content = content + [{
            "prompt": user_action,
            "user": ObjectId(user_id),
            "response": "He narrows his eyes and says, 'Who wants to know?'"
        }]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "The Case of the Vanished Dame",
                    "description": "A noir mystery.",
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "content": content,
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "The Case of the Vanished Dame",
                    "description": "A noir mystery.",
                    "ownerid": ownerid,
                    "dialect": dialect,
                    "content": updated_content,
                    "complete": False
                }
            ])
            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="He narrows his eyes and says, 'Who wants to know?'")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action=user_action
            )
            result = await continue_story_api(req)
            assert result["summary"] == ""
            assert result["character"] == character
            assert result["content"][-1]["prompt"] == user_action

    # --- EDGE CASES ---

    @pytest.mark.edge_case
    async def test_continue_story_invalid_story_id(self):
        """
        Test that an invalid story_id format raises HTTP 400.
        """
        req = ContinueStoryRequest(
            story_id="not_a_valid_oid",
            user_id=str(ObjectId()),
            user_action="Test action"
        )
        with pytest.raises(HTTPException) as excinfo:
            await continue_story_api(req)
        assert excinfo.value.status_code == 400
        assert "Invalid story_id format" in excinfo.value.detail

    @pytest.mark.edge_case
    async def test_continue_story_invalid_user_id(self):
        """
        Test that an invalid user_id format raises HTTP 400.
        """
        req = ContinueStoryRequest(
            story_id=str(ObjectId()),
            user_id="not_a_valid_oid",
            user_action="Test action"
        )
        with pytest.raises(HTTPException) as excinfo:
            await continue_story_api(req)
        assert excinfo.value.status_code == 400
        assert "Invalid user_id format" in excinfo.value.detail

    @pytest.mark.edge_case
    async def test_continue_story_story_not_found(self):
        """
        Test that a missing story in the DB raises HTTP 404.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        with patch("storyteller_fastapi.story_collection") as mock_collection:
            mock_collection.find_one = AsyncMock(return_value=None)
            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Test action"
            )
            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)
            assert excinfo.value.status_code == 404
            assert excinfo.value.detail == "Story not found"

    @pytest.mark.edge_case
    async def test_continue_story_user_not_in_ownerid(self):
        """
        Test that if the user is not in the story's ownerid, character is None but function still works.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        other_user_id = str(ObjectId())
        content = []
        ownerid = [{"owner": ObjectId(other_user_id), "character": "NotYou"}]
        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Lost",
                    "description": "Lost in the woods.",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "content": content,
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Lost",
                    "description": "Lost in the woods.",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "content": [{
                        "prompt": "Shout for help",
                        "user": ObjectId(user_id),
                        "response": "Your voice echoes in the trees."
                    }],
                    "complete": False
                }
            ])
            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="Your voice echoes in the trees.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Shout for help"
            )
            result = await continue_story_api(req)
            assert result["character"] is None
            assert result["content"][-1]["prompt"] == "Shout for help"

    @pytest.mark.edge_case
    async def test_continue_story_empty_content(self):
        """
        Test that continue_story_api works when the story's content is empty.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Solo"
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Alone",
                    "description": "A solitary journey.",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "content": [],
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Alone",
                    "description": "A solitary journey.",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "content": [{
                        "prompt": "Start walking",
                        "user": ObjectId(user_id),
                        "response": "You begin your journey alone."
                    }],
                    "complete": False
                }
            ])
            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="You begin your journey alone.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Start walking"
            )
            result = await continue_story_api(req)
            assert result["content"][-1]["prompt"] == "Start walking"
            assert result["content"][-1]["response"] == "You begin your journey alone."

    @pytest.mark.edge_case
    async def test_continue_story_db_update_failure(self):
        """
        Test that a DB update failure raises HTTP 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "FailGuy"
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            mock_collection.find_one = AsyncMock(return_value={
                "_id": ObjectId(story_id),
                "title": "Fail Story",
                "description": "A story that fails.",
                "ownerid": ownerid,
                "dialect": "American English",
                "content": [],
                "complete": False
            })
            # Simulate update_one raising an exception
            mock_collection.update_one = AsyncMock(side_effect=Exception("DB error"))
            mock_story_chain.ainvoke = AsyncMock(return_value="Failure is imminent.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Try to win"
            )
            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)
            assert excinfo.value.status_code == 500
            assert "Internal Server Error" in excinfo.value.detail

    @pytest.mark.edge_case
    async def test_continue_story_llm_failure(self):
        """
        Test that an LLM (story_chain) failure raises HTTP 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "LLMFail"
        ownerid = [{"owner": ObjectId(user_id), "character": character}]
        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:
            mock_collection.find_one = AsyncMock(return_value={
                "_id": ObjectId(story_id),
                "title": "LLM Down",
                "description": "A story with a broken LLM.",
                "ownerid": ownerid,
                "dialect": "American English",
                "content": [],
                "complete": False
            })
            mock_collection.update_one = AsyncMock()
            # Simulate LLM failure
            mock_story_chain.ainvoke = AsyncMock(side_effect=Exception("LLM error"))

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Try to talk"
            )
            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)
            assert excinfo.value.status_code == 500
            assert "Internal Server Error" in excinfo.value.detail

        # ---------------------------------------------------------
    # MISSING EDGE CASES (ADDED)
    # ---------------------------------------------------------

    @pytest.mark.edge_case
    async def test_continue_story_summary_chain_failure(self):
        """
        If summary_chain fails during summarization, the API should return HTTP 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())

        # Content long enough to trigger summarization
        content = [{"prompt": f"A{i}", "user": ObjectId(), "response": f"R{i}"} for i in range(20)]
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.summary_chain") as mock_summary_chain:

            mock_collection.find_one = AsyncMock(return_value={
                "_id": ObjectId(story_id),
                "title": "Summary Failure",
                "description": "Test desc",
                "ownerid": ownerid,
                "dialect": "American English",
                "summary": "",
                "content": content,
                "complete": False
            })

            mock_collection.update_one = AsyncMock()

            # Force summary_chain to fail
            mock_summary_chain.ainvoke = AsyncMock(side_effect=Exception("Summarizer broke"))

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Move forward"
            )

            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)

            assert excinfo.value.status_code == 500
            assert "Internal Server Error" in excinfo.value.detail


    @pytest.mark.edge_case
    async def test_continue_story_summary_chain_invalid_output(self):
        """
        If summary_chain returns invalid output (None or non-string), the API should raise 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())

        content = [{"prompt": f"A{i}", "user": ObjectId(), "response": f"R{i}"} for i in range(20)]
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain, \
             patch("storyteller_fastapi.summary_chain") as mock_summary_chain:

            mock_collection.find_one = AsyncMock(return_value={
                "_id": ObjectId(story_id),
                "title": "Invalid Summary Output",
                "description": "Test",
                "ownerid": ownerid,
                "dialect": "American English",
                "summary": "",
                "content": content,
                "complete": False
            })

            mock_collection.update_one = AsyncMock()

            # Return invalid summary format
            mock_summary_chain.ainvoke = AsyncMock(return_value=None)

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Try something"
            )

            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)

            assert excinfo.value.status_code == 500


    @pytest.mark.edge_case
    async def test_continue_story_malformed_content_entries(self):
        """
        If story content contains malformed entries (missing keys), API should still process 
        but fill defaults without crashing.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        malformed_content = [
            {},  # completely empty
            {"prompt": "P"},  # missing user & response
            {"response": "R"},  # missing prompt
            {"user": ObjectId()},  # missing prompt & response
        ]

        updated_content = malformed_content + [{
            "prompt": "Act",
            "user": ObjectId(user_id),
            "response": "Done."
        }]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:

            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Malformed",
                    "description": "Test malformed content",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "summary": "",
                    "content": malformed_content,
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Malformed",
                    "description": "Test malformed content",
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "summary": "",
                    "content": updated_content,
                    "complete": False
                }
            ])

            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="Done.")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Act"
            )

            result = await continue_story_api(req)

            assert len(result["content"]) == 5
            assert result["content"][-1]["response"] == "Done."


    @pytest.mark.edge_case
    async def test_continue_story_non_list_content(self):
        """
        If 'content' is not a list, the API should raise HTTP 500 instead of iterating.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        # invalid content (string instead of list)
        bad_content = "not a list"

        with patch("storyteller_fastapi.story_collection") as mock_collection:

            mock_collection.find_one = AsyncMock(return_value={
                "_id": ObjectId(story_id),
                "title": "Bad Content",
                "description": "Content is not list",
                "ownerid": ownerid,
                "dialect": "American English",
                "summary": "",
                "content": bad_content,
                "complete": False
            })

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Fix it"
            )

            with pytest.raises(HTTPException) as excinfo:
                await continue_story_api(req)

            assert excinfo.value.status_code == 500


    @pytest.mark.edge_case
    async def test_continue_story_invalid_dialect_type(self):
        """
        If dialect is an invalid type (e.g., int), the API should still work 
        because dialect is only interpolated as a string.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:

            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Bad dialect",
                    "description": "Test",
                    "ownerid": ownerid,
                    "dialect": 12345,  # invalid type
                    "summary": "",
                    "content": [],
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Bad dialect",
                    "description": "Test",
                    "ownerid": ownerid,
                    "dialect": 12345,
                    "summary": "",
                    "content": [{
                        "prompt": "Test",
                        "user": ObjectId(user_id),
                        "response": "OK"
                    }],
                    "complete": False
                }
            ])

            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="OK")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Test"
            )

            result = await continue_story_api(req)

            # Should not fail; dialect coerces to string when formatting
            assert result["dialect"] == 12345


    @pytest.mark.edge_case
    async def test_continue_story_ownerid_missing(self):
        """
        If ownerid is missing entirely, character should be None but API still works.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:

            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "title": "Missing ownerid",
                    "description": "Test",
                    "dialect": "American English",
                    "summary": "",
                    "content": [],
                    "complete": False
                },
                {
                    "_id": ObjectId(story_id),
                    "title": "Missing ownerid",
                    "description": "Test",
                    "dialect": "American English",
                    "summary": "",
                    "content": [{
                        "prompt": "Proceed",
                        "user": ObjectId(user_id),
                        "response": "Done"
                    }],
                    "complete": False
                }
            ])

            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="Done")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Proceed"
            )

            result = await continue_story_api(req)

            assert result["character"] is None
            assert result["content"][-1]["response"] == "Done"


    @pytest.mark.edge_case
    async def test_continue_story_missing_title_description(self):
        """
        If title or description is missing in DB object, API should default them safely.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        ownerid = [{"owner": ObjectId(user_id), "character": "Hero"}]

        with patch("storyteller_fastapi.story_collection") as mock_collection, \
             patch("storyteller_fastapi.story_chain") as mock_story_chain:

            # First find_one → missing title & description
            mock_collection.find_one = AsyncMock(side_effect=[
                {
                    "_id": ObjectId(story_id),
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "summary": "",
                    "content": [],
                    "complete": False
                },
                # After update, DB returns the populated content
                {
                    "_id": ObjectId(story_id),
                    "ownerid": ownerid,
                    "dialect": "American English",
                    "summary": "",
                    "content": [{
                        "prompt": "Act",
                        "user": ObjectId(user_id),
                        "response": "OK"
                    }],
                    "complete": False
                }
            ])

            mock_collection.update_one = AsyncMock()
            mock_story_chain.ainvoke = AsyncMock(return_value="OK")

            req = ContinueStoryRequest(
                story_id=story_id,
                user_id=user_id,
                user_action="Act"
            )

            result = await continue_story_api(req)

            assert result["title"] == ""      # defaults safely
            assert result["description"] == ""  # defaults safely
            assert result["content"][-1]["response"] == "OK"

import pytest
import types
from unittest.mock import AsyncMock, patch, MagicMock
from bson import ObjectId
from fastapi import HTTPException

from LLM_API import continue_story_api, ContinueStoryRequest

import pytest
import os
from unittest.mock import patch

# Add this fixture definition
@pytest.fixture
def patch_env():
    """
    Patches environment variables needed for the API tests.
    """
    env_vars = {
        "MAX_RECENT": "15",
        "SUMMARY_TRIGGER": "10"
    }
    
    with patch.dict(os.environ, env_vars):
        yield

class TestContinueStoryApi:
    @pytest.fixture(autouse=True)
    def setup_mocks(self):
        # Patch story_repo and llm_service in LLM_API
        patcher_repo = patch("LLM_API.story_repo", autospec=True)
        patcher_llm = patch("LLM_API.llm_service", autospec=True)
        self.mock_repo = patcher_repo.start()
        self.mock_llm = patcher_llm.start()
        yield
        patcher_repo.stop()
        patcher_llm.stop()

    @pytest.mark.happy
    @pytest.mark.asyncio
    async def test_happy_path_basic(self):
        """
        Test normal operation: valid story/user, content < MAX_RECENT, character found.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        user_action = "Go north"
        character = "Alice"
        dialect = "British English"
        story = {
            "_id": ObjectId(story_id),
            "title": "Test Story",
            "description": "A test story.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": dialect,
            "summary": "Once upon a time...",
            "content": [
                {"prompt": "Start", "user": ObjectId(user_id), "response": "It begins."}
            ],
            "complete": False,
        }
        # Setup mocks
        self.mock_repo.find_story = AsyncMock(return_value=story)
        self.mock_llm.continue_story = MagicMock(return_value="The story continues.")
        self.mock_repo.push_content = AsyncMock()
        self.mock_repo.update_story = AsyncMock()
        self.mock_repo.find_story = AsyncMock(side_effect=[story, {**story, "content": story["content"] + [{"prompt": user_action, "user": ObjectId(user_id), "response": "The story continues."}]}])

        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action=user_action,
        )
        result = await continue_story_api(req)
        assert result["story_id"] == story_id
        assert result["title"] == "Test Story"
        assert result["character"] == character
        assert result["dialect"] == dialect
        assert result["summary"] == "Once upon a time..."
        assert result["complete"] is False
        assert any(c["prompt"] == user_action for c in result["content"])

    @pytest.mark.happy
    @pytest.mark.asyncio
    async def test_happy_path_no_summary(self):
        """
        Test normal operation: story has no summary, content < MAX_RECENT.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        user_action = "Look around"
        character = "Bob"
        story = {
            "_id": ObjectId(story_id),
            "title": "No Summary Story",
            "description": "No summary yet.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": "American English",
            "summary": "",
            "content": [],
            "complete": False,
        }
        self.mock_repo.find_story = AsyncMock(side_effect=[story, {**story, "content": [{"prompt": user_action, "user": ObjectId(user_id), "response": "You see a forest."}]}])
        self.mock_llm.continue_story = MagicMock(return_value="You see a forest.")
        self.mock_repo.push_content = AsyncMock()
        self.mock_repo.update_story = AsyncMock()

        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action=user_action,
        )
        result = await continue_story_api(req)
        assert result["summary"] == ""
        assert result["character"] == character
        assert result["title"] == "No Summary Story"
        assert result["content"][0]["prompt"] == user_action

    @pytest.mark.happy
    @pytest.mark.asyncio
    async def test_happy_path_character_not_found(self):
        """
        Test: user_id not found in ownerid, character should be None.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        other_user = str(ObjectId())
        user_action = "Jump"
        story = {
            "_id": ObjectId(story_id),
            "title": "No Character",
            "description": "No character for this user.",
            "ownerid": [{"owner": ObjectId(other_user), "character": "Eve"}],
            "dialect": "American English",
            "summary": "",
            "content": [],
            "complete": False,
        }
        self.mock_repo.find_story = AsyncMock(side_effect=[story, {**story, "content": [{"prompt": user_action, "user": ObjectId(user_id), "response": "You jump high."}]}])
        self.mock_llm.continue_story = MagicMock(return_value="You jump high.")
        self.mock_repo.push_content = AsyncMock()
        self.mock_repo.update_story = AsyncMock()

        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action=user_action,
        )
        result = await continue_story_api(req)
        assert result["character"] is None
        assert result["content"][0]["prompt"] == user_action

    @pytest.mark.happy
    @pytest.mark.asyncio
    async def test_happy_path_summary_triggered(self):
        """
        Test: content > MAX_RECENT triggers summarization and content truncation.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        user_action = "Open the door"
        character = "Sam"
        # 16 content entries (MAX_RECENT=15, SUMMARY_TRIGGER=10)
        content = [{"prompt": f"Action {i}", "user": ObjectId(user_id), "response": f"Resp {i}"} for i in range(16)]
        story = {
            "_id": ObjectId(story_id),
            "title": "Long Story",
            "description": "A long story.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": "American English",
            "summary": "Old summary.",
            "content": content,
            "complete": False,
        }
        # After summarization, content should be content[10:]
        new_summary = "Merged summary."
        updated_story = {**story, "summary": new_summary, "content": content[10:] + [{"prompt": user_action, "user": ObjectId(user_id), "response": "You open the door."}]}
        self.mock_repo.find_story = AsyncMock(side_effect=[story, updated_story])
        self.mock_llm.summarize = AsyncMock(return_value=new_summary)
        self.mock_llm.continue_story = MagicMock(return_value="You open the door.")
        self.mock_repo.update_story = AsyncMock()
        self.mock_repo.push_content = AsyncMock()

        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action=user_action,
        )
        result = await continue_story_api(req)
        assert result["summary"] == new_summary
        # Only the last 6 (16-10) + new entry
        assert len(result["content"]) == 7
        assert result["content"][-1]["prompt"] == user_action

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_invalid_story_id(self):
        """
        Test: invalid story_id format raises HTTPException 400.
        """
        req = ContinueStoryRequest(
            story_id="notanobjectid",
            user_id=str(ObjectId()),
            user_action="Test",
        )
        with pytest.raises(HTTPException) as exc:
            await continue_story_api(req)
        assert exc.value.status_code == 400
        assert "Invalid story_id format" in str(exc.value.detail)

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_invalid_user_id(self):
        """
        Test: invalid user_id format raises HTTPException 400.
        """
        req = ContinueStoryRequest(
            story_id=str(ObjectId()),
            user_id="notanobjectid",
            user_action="Test",
        )
        with pytest.raises(HTTPException) as exc:
            await continue_story_api(req)
        assert exc.value.status_code == 400
        assert "Invalid user_id format" in str(exc.value.detail)

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_story_not_found(self):
        """
        Test: story_repo.find_story returns None, should raise 404.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        self.mock_repo.find_story = AsyncMock(return_value=None)
        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action="Test",
        )
        with pytest.raises(HTTPException) as exc:
            await continue_story_api(req)
        assert exc.value.status_code == 404
        assert "Story not found" in str(exc.value.detail)

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_llm_service_raises(self):
        """
        Test: llm_service.continue_story raises an exception, should return 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Alice"
        story = {
            "_id": ObjectId(story_id),
            "title": "Test Story",
            "description": "A test story.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": "British English",
            "summary": "Once upon a time...",
            "content": [],
            "complete": False,
        }
        self.mock_repo.find_story = AsyncMock(side_effect=[story])
        self.mock_llm.continue_story = MagicMock(side_effect=Exception("LLM error"))
        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action="Go north",
        )
        with pytest.raises(HTTPException) as exc:
            await continue_story_api(req)
        assert exc.value.status_code == 500
        assert "Internal Server Error" in str(exc.value.detail)

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_push_content_raises(self):
        """
        Test: story_repo.push_content raises, should return 500.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Alice"
        story = {
            "_id": ObjectId(story_id),
            "title": "Test Story",
            "description": "A test story.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": "British English",
            "summary": "Once upon a time...",
            "content": [],
            "complete": False,
        }
        self.mock_repo.find_story = AsyncMock(side_effect=[story])
        self.mock_llm.continue_story = MagicMock(return_value="Next scene.")
        self.mock_repo.push_content = AsyncMock(side_effect=Exception("DB error"))
        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action="Go north",
        )
        with pytest.raises(HTTPException) as exc:
            await continue_story_api(req)
        assert exc.value.status_code == 500
        assert "Internal Server Error" in str(exc.value.detail)

    @pytest.mark.edge
    @pytest.mark.asyncio
    async def test_continue_story_async(self):
        """
        Test: llm_service.continue_story returns a coroutine (async), should be awaited.
        """
        story_id = str(ObjectId())
        user_id = str(ObjectId())
        character = "Alice"
        story = {
            "_id": ObjectId(story_id),
            "title": "Test Story",
            "description": "A test story.",
            "ownerid": [{"owner": ObjectId(user_id), "character": character}],
            "dialect": "British English",
            "summary": "Once upon a time...",
            "content": [],
            "complete": False,
        }
        self.mock_repo.find_story = AsyncMock(side_effect=[story, {**story, "content": [{"prompt": "Go north", "user": ObjectId(user_id), "response": "Async next scene."}]}])
        async def async_continue_story(*args, **kwargs):
            return "Async next scene."
        self.mock_llm.continue_story = async_continue_story
        self.mock_repo.push_content = AsyncMock()
        self.mock_repo.update_story = AsyncMock()

        req = ContinueStoryRequest(
            story_id=story_id,
            user_id=user_id,
            user_action="Go north",
        )
        result = await continue_story_api(req)
        assert any(c["response"] == "Async next scene." for c in result["content"])
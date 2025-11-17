import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from LLM_API import start_new_story, NewStoryRequest, Owner


@pytest.mark.asyncio
class TestStartNewStory:

    async def test_basic_success(self):
        req = NewStoryRequest(
            name="The Lost City",
            description="Adventure desc",
            owner=Owner(owner="user1", character="Hero"),
            genre="adventure"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "Epic"
            mock_llm.generate_initial_scene.return_value = "Scene..."

            result = await start_new_story(req)

        assert result == {
            "content": "Scene...",
            "character": "Hero",
            "dialect": "Epic",
        }

    async def test_genre_none_defaults_to_adventure(self):
        req = NewStoryRequest(
            name="Space",
            description="Stars",
            owner=Owner(owner="u2", character="Pilot"),
            genre=None
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "SciFi"
            mock_llm.generate_initial_scene.return_value = "Space scene"

            res = await start_new_story(req)

        assert res["dialect"] == "SciFi"
        assert res["content"] == "Space scene"

    async def test_dialect_stripped_quotes(self):
        req = NewStoryRequest(
            name="Mystery",
            description="desc",
            owner=Owner(owner="u3", character="Detective"),
            genre="mystery"
        )

        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = '  "Noir"  '
            mock_llm.generate_initial_scene.return_value = "Dark scene"

            res = await start_new_story(req)

        assert res["dialect"] == "Noir"


    async def test_missing_name_returns_400(self):
        req = NewStoryRequest(
            name="",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="adventure",
        )
        with pytest.raises(HTTPException) as exc:
            await start_new_story(req)
        assert exc.value.status_code == 400

    async def test_missing_owner_returns_400(self):
        req = NewStoryRequest(
            name="Test",
            description="desc",
            owner=None,
            genre="adventure",
        )
        with pytest.raises(HTTPException) as exc:
            await start_new_story(req)
        assert exc.value.status_code == 400

    async def test_character_none_returns_400(self):
        req = NewStoryRequest(
            name="Story",
            description="Desc",
            owner=Owner(owner="u", character=None),
            genre="adventure"
        )
        with pytest.raises(HTTPException):
            await start_new_story(req)

    async def test_empty_genre_defaults_to_adventure(self):
        req = NewStoryRequest(
            name="Epic",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre=""
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "Heroic"
            mock_llm.generate_initial_scene.return_value = "Epic Scene"

            res = await start_new_story(req)

        assert res["dialect"] == "Heroic"

    async def test_description_none_converted_to_empty_string(self):
        req = NewStoryRequest(
            name="DescNone",
            description=None,
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "Magic"
            mock_llm.generate_initial_scene.return_value = "Wizardry..."

            res = await start_new_story(req)

        mock_llm.generate_dialect.assert_called_once_with("")
        assert res["dialect"] == "Magic"

    async def test_llm_returns_none_dialect_defaulted(self):
        req = NewStoryRequest(
            name="Epic",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = None
            mock_llm.generate_initial_scene.return_value = "Scene"

            res = await start_new_story(req)

        assert res["dialect"] == "default"

    async def test_llm_returns_empty_dialect_defaulted(self):
        req = NewStoryRequest(
            name="EmptyDialect",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "   "
            mock_llm.generate_initial_scene.return_value = "Scene"

            res = await start_new_story(req)

        assert res["dialect"] == "default"

    async def test_llm_initial_scene_none_raises_500(self):
        req = NewStoryRequest(
            name="Broken",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )

        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "Fantasy"
            mock_llm.generate_initial_scene.return_value = None

            with pytest.raises(HTTPException) as exc:
                await start_new_story(req)

        assert exc.value.status_code == 500

    async def test_generate_dialect_raises_exception(self):
        req = NewStoryRequest(
            name="Error Story",
            description="desc",
            owner=Owner(owner="u", character="Crash"),
            genre="tragedy"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.side_effect = Exception("Dialect error")

            with pytest.raises(HTTPException) as exc:
                await start_new_story(req)

        assert exc.value.status_code == 500
        assert "Dialect error" in str(exc.value.detail)

    async def test_generate_initial_scene_raises_exception(self):
        req = NewStoryRequest(
            name="Scene Error",
            description="desc",
            owner=Owner(owner="u", character="Crash2"),
            genre="comedy"
        )
        with patch("LLM_API.llm_service") as mock_llm:
            mock_llm.generate_dialect.return_value = "Funny"
            mock_llm.generate_initial_scene.side_effect = Exception("Scene error")

            with pytest.raises(HTTPException) as exc:
                await start_new_story(req)

        assert exc.value.status_code == 500
        assert "Scene error" in str(exc.value.detail)

    async def test_FAILED_previous_missing_name(self):
        req = NewStoryRequest(
            name="",
            description="desc",
            owner=Owner(owner="u", character="char"),
            genre="adventure"
        )
        with pytest.raises(HTTPException):
            await start_new_story(req)

    async def test_FAILED_previous_missing_owner(self):
        req = NewStoryRequest(
            name="Story",
            description="desc",
            owner=None,
            genre="adventure"
        )
        with pytest.raises(HTTPException):
            await start_new_story(req)

    async def test_FAILED_previous_character_none(self):
        req = NewStoryRequest(
            name="Story",
            description="desc",
            owner=Owner(owner="u", character=None),
            genre="adventure"
        )
        with pytest.raises(HTTPException):
            await start_new_story(req)


    async def test_FAILED_previous_llm_none_dialect(self):
        req = NewStoryRequest(
            name="Epic",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )
        with patch("LLM_API.llm_service") as mock:
            mock.generate_dialect.return_value = None
            mock.generate_initial_scene.return_value = "Scene"
            with pytest.raises(Exception):
                await start_new_story(req)

    async def test_FAILED_previous_scene_none(self):
        req = NewStoryRequest(
            name="Broken",
            description="desc",
            owner=Owner(owner="u", character="c"),
            genre="fantasy"
        )
        with patch("LLM_API.llm_service") as mock:
            mock.generate_dialect.return_value = "Fantasy"
            mock.generate_initial_scene.return_value = None
            with pytest.raises(Exception):
                await start_new_story(req)

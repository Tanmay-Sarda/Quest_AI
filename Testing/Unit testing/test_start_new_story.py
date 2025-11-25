import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from storyteller_fastapi import app

client = TestClient(app)


@pytest.fixture
def valid_owner():
    return {"owner": "user123", "character": "Alice"}

@pytest.fixture
def valid_request(valid_owner):
    return {
        "name": "The Lost City",
        "description": "A mysterious city hidden in the jungle.",
        "owner": valid_owner,
        "genre": "adventure"
    }


def mock_chain(return_value=None, side=None):
    mock = MagicMock()
    if side:
        mock.invoke.side_effect = side
    else:
        mock.invoke.return_value = return_value
    return mock


class TestStartNewStory:


    def test_start_new_story_successful(self, valid_request):
        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("British English")), \
             patch("storyteller_fastapi.setup_chain",   new=mock_chain("You find yourself...")):

            response = client.post("/story/new", json=valid_request)
            data = response.json()

            assert response.status_code == 200
            assert data["dialect"] == "British English"
            assert data["content"].startswith("You find yourself")


    def test_start_new_story_with_default_genre(self, valid_owner):

        req = {
            "name": "Space Quest",
            "description": "Journey to the stars.",
            "owner": valid_owner
        }

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Space Opera")), \
             patch("storyteller_fastapi.setup_chain", new=MagicMock()) as mock_setup:

            mock_setup.invoke.return_value = "Intro Scene"

            response = client.post("/story/new", json=req)
            args = mock_setup.invoke.call_args[0][0]

            assert args["genre"] == "adventure"


    def test_start_new_story_with_various_characters(self, valid_request):

        for char in ["Bob", "Élise", "李雷", "O'Connor"]:
            req = valid_request.copy()
            req["owner"] = req["owner"].copy()
            req["owner"]["character"] = char

            with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Detective Noir")), \
                 patch("storyteller_fastapi.setup_chain", new=mock_chain(f"You are {char}")):

                resp = client.post("/story/new", json=req)
                assert resp.json()["character"] == char


    def test_start_new_story_with_long_description(self, valid_request):

        req = valid_request.copy()
        req["description"] = "A" * 5000

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Epic")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Long scene...")):

            resp = client.post("/story/new", json=req)
            assert resp.json()["dialect"] == "Epic"


    def test_start_new_story_empty_description(self, valid_request):

        req = valid_request.copy()
        req["description"] = ""

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Scene...")):

            resp = client.post("/story/new", json=req)
            assert resp.json()["dialect"] == ""


    def test_start_new_story_genre_none(self, valid_request):

        req = valid_request.copy()
        req["genre"] = None

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Fantasy")), \
             patch("storyteller_fastapi.setup_chain", new=MagicMock()) as mock_setup:

            mock_setup.invoke.return_value = "Fantasy intro"

            response = client.post("/story/new", json=req)
            args = mock_setup.invoke.call_args[0][0]

            assert args["genre"] == "adventure"


    def test_start_new_story_special_characters_in_fields(self, valid_request):

        req = valid_request.copy()
        req["name"] = "The @dventure! #2024"
        req["description"] = "Symbols 😊🚀"

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Emoji Dialect")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Emoji Scene")):

            resp = client.post("/story/new", json=req)
            assert resp.json()["dialect"] == "Emoji Dialect"


    def test_start_new_story_llm_error(self, valid_request):

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain(side=Exception("LLM DOWN"))):
            resp = client.post("/story/new", json=valid_request)
            assert resp.status_code == 500


    def test_start_new_story_setup_chain_error(self, valid_request):

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("British")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain(side=Exception("Setup Fail"))):

            resp = client.post("/story/new", json=valid_request)
            assert resp.status_code == 500


    def test_start_new_story_dialect_with_quotes(self, valid_request):

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain('"Cyberpunk"')), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Scene...")):

            resp = client.post("/story/new", json=valid_request)
            assert resp.json()["dialect"] == "Cyberpunk"


    def test_start_new_story_strip_quotes_and_spaces(self, valid_request):

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain('  """ Medieval Bard """ ')), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Scene")):

            resp = client.post("/story/new", json=valid_request)
            assert resp.json()["dialect"] == "Medieval Bard"


    def test_start_new_story_whitespace_dialect(self, valid_request):

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("     ")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Scene")):

            resp = client.post("/story/new", json=valid_request)
            assert resp.json()["dialect"] == ""


    def test_start_new_story_character_emojis(self, valid_request):

        req = valid_request.copy()
        req["owner"]["character"] = "Zara🔥🐉"

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Fantasy Epic")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Epic...")):

            resp = client.post("/story/new", json=req)
            assert resp.json()["character"] == "Zara🔥🐉"


    def test_start_new_story_long_character_name(self, valid_request):

        long_name = "A" * 500
        req = valid_request.copy()
        req["owner"]["character"] = long_name

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Epic Tone")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain("Scene")):

            resp = client.post("/story/new", json=req)
            assert resp.json()["character"] == long_name


    def test_start_new_story_setup_chain_weird_format(self, valid_request):

        weird = "\n\n  ## Scene ##  \n"

        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("Narrator")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain(weird)):

            resp = client.post("/story/new", json=valid_request)
            assert resp.json()["content"] == weird


    def test_missing_name_returns_422(self, valid_request):
        req = valid_request.copy()
        del req["name"]
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_missing_description_returns_422(self, valid_request):
        req = valid_request.copy()
        del req["description"]
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_missing_owner_returns_422(self, valid_request):
        req = valid_request.copy()
        del req["owner"]
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_missing_character_returns_422(self, valid_request):
        req = valid_request.copy()
        req["owner"] = {"owner": "abc"}  # missing character
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_missing_owner_id_returns_422(self, valid_request):
        req = valid_request.copy()
        req["owner"] = {"character": "Alice"}  # missing owner
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_owner_wrong_type_returns_422(self, valid_request):
        req = valid_request.copy()
        req["owner"] = "not-a-dict"
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_genre_wrong_type_returns_422(self, valid_request):
        req = valid_request.copy()
        req["genre"] = 12345
        resp = client.post("/story/new", json=req)
        assert resp.status_code == 422

    def test_llm_returns_none_dialect(self, valid_request):
        with patch("storyteller_fastapi.dialect_chain", new=mock_chain(None)):
            resp = client.post("/story/new", json=valid_request)
            assert resp.status_code == 500

    def test_llm_returns_non_string_dialect(self, valid_request):
        with patch("storyteller_fastapi.dialect_chain", new=mock_chain(123)):
            resp = client.post("/story/new", json=valid_request)
            assert resp.status_code == 500

    def test_setup_chain_returns_none(self, valid_request):
        with patch("storyteller_fastapi.dialect_chain", new=mock_chain("English")), \
             patch("storyteller_fastapi.setup_chain", new=mock_chain(None)):
            resp = client.post("/story/new", json=valid_request)
            assert resp.status_code == 500

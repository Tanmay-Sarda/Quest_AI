import pytest

from storyteller_fastapi import format_story_chunk

class TestFormatStoryChunk:
    # -------------------- HAPPY PATHS --------------------
    @pytest.mark.happy_path
    def test_single_dict_in_list(self):
        """Test formatting with a single dict containing both 'prompt' and 'response'."""
        input_data = [{"prompt": "Say hello", "response": "Hello, world!"}]
        expected = "Say hello: Hello, world!"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.happy_path
    def test_multiple_dicts_in_list(self):
        """Test formatting with multiple dicts in the list."""
        input_data = [
            {"prompt": "First", "response": "One"},
            {"prompt": "Second", "response": "Two"},
            {"prompt": "Third", "response": "Three"},
        ]
        expected = "First: One\nSecond: Two\nThird: Three"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.happy_path
    def test_dicts_with_extra_keys(self):
        """Test formatting when dicts contain extra keys beyond 'prompt' and 'response'."""
        input_data = [
            {"prompt": "A", "response": "B", "extra": "ignore"},
            {"prompt": "C", "response": "D", "foo": "bar"},
        ]
        expected = "A: B\nC: D"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.happy_path
    def test_dicts_with_empty_prompt_and_response(self):
        """Test formatting when 'prompt' and 'response' are empty strings."""
        input_data = [
            {"prompt": "", "response": ""},
            {"prompt": "Prompt", "response": ""},
            {"prompt": "", "response": "Response"},
        ]
        expected = ": \nPrompt: \n: Response"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.happy_path
    def test_dicts_with_none_prompt_and_response(self):
        """Test formatting when 'prompt' and 'response' are None."""
        input_data = [
            {"prompt": None, "response": None},
            {"prompt": "Prompt", "response": None},
            {"prompt": None, "response": "Response"},
        ]
        expected = ": \nPrompt: \n: Response"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.happy_path
    def test_dicts_with_missing_prompt_or_response(self):
        """Test formatting when dicts are missing 'prompt' or 'response' keys."""
        input_data = [
            {"prompt": "PromptOnly"},
            {"response": "ResponseOnly"},
            {},
        ]
        expected = "PromptOnly: \n: ResponseOnly\n: "
        assert format_story_chunk(input_data) == expected

    # -------------------- EDGE CASES --------------------
    @pytest.mark.edge_case
    def test_empty_list(self):
        """Test formatting with an empty list."""
        input_data = []
        expected = ""
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_non_list_input_none(self):
        """Test formatting when input is None."""
        input_data = None
        expected = ""
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_non_list_input_string(self):
        """Test formatting when input is a string."""
        input_data = "not a list"
        expected = ""
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_non_list_input_dict(self):
        """Test formatting when input is a dict."""
        input_data = {"prompt": "A", "response": "B"}
        expected = ""
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_list_with_non_dict_elements(self):
        """Test formatting when list contains non-dict elements."""
        input_data = [
            {"prompt": "A", "response": "B"},
            "not a dict",
            123,
            None,
            ["list"],
            {"prompt": "C", "response": "D"},
        ]
        # Only dicts will be processed, others will default to empty string for both keys
        expected = "A: B\n: \n: \n: \n: \nC: D"
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_list_with_dicts_missing_all_keys(self):
        """Test formatting when all dicts are missing both 'prompt' and 'response'."""
        input_data = [{}, {}, {}]
        expected = ": \n: \n: "
        assert format_story_chunk(input_data) == expected

    @pytest.mark.edge_case
    def test_list_with_mixed_valid_and_invalid_dicts(self):
        """Test formatting with a mix of valid and invalid dicts."""
        input_data = [
            {"prompt": "A", "response": "B"},
            {},
            {"prompt": "C"},
            {"response": "D"},
            {"prompt": None, "response": None},
        ]
        expected = "A: B\n: \nC: \n: D\n: "
        assert format_story_chunk(input_data) == expected
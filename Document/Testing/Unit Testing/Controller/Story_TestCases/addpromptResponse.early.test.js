import axios from 'axios';
import mongoose from 'mongoose';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';

// Mock everything FIRST
jest.mock('axios');
jest.mock("mongoose", () => {
  function MockSchema() {}
  MockSchema.prototype.pre = jest.fn();
  MockSchema.prototype.methods = {};
  MockSchema.prototype.statics = {};
  MockSchema.prototype.index = jest.fn();

  const FakeModel = {
    findById: jest.fn(),
  };

  return {
    Schema: MockSchema,
    model: jest.fn(() => FakeModel),
  };
});


jest.mock('../../utils/ApiError.js', () => 
  jest.fn().mockImplementation((status, message) => ({ status, message }))
);

jest.mock('../../utils/ApiResponse.js', () => 
  jest.fn().mockImplementation((success, data, message) => ({ success, data, message }))
);

// Mock Story model completely
const mockStoryFindById = jest.fn();
const mockStorySelect = jest.fn();

jest.mock('../../models/Story.models.js', () => ({
  Story: {
    findById: mockStoryFindById
  }
}));

// Now import the controller
const { addpromptResponse } = require('../story.controller.js');

describe('addpromptResponse() method', () => {
  let req, res;
  let mockUserModel;

  beforeEach(() => {
    req = {
      params: { story_id: 'validStoryId' },
      body: { prompt: 'Test prompt' },
      user: { _id: 'userId123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockUserModel = {
      findById: jest.fn()
    };
    mongoose.model.mockReturnValue(mockUserModel);

    process.env.FASTAPI_URL = 'http://localhost:8000';

    // Clear all mocks
    jest.clearAllMocks();
    mockStoryFindById.mockClear();
  });

  // Debug test to see what's actually happening
  it('DEBUG - should log what happens in the controller', async () => {
    const mockUser = { 
      _id: 'userId123',
      apiKey: 'test-api-key' 
    };
    const mockUpdatedStory = {
      _id: 'validStoryId',
      content: [
        { prompt: 'Previous prompt', response: 'Previous response' },
        { prompt: 'Test prompt', response: 'AI generated response' }
      ]
    };

    mockUserModel.findById.mockResolvedValue(mockUser);
    axios.post.mockResolvedValue({ data: {} });
    mockStoryFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUpdatedStory)
    });

    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    await addpromptResponse(req, res);

    console.error = originalConsoleError;
  });

  describe('Happy paths', () => {
    it('should successfully add prompt response to story', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: 'test-api-key' 
      };
      const mockUpdatedStory = {
        _id: 'validStoryId',
        content: [
          { prompt: 'Previous prompt', response: 'Previous response' },
          { prompt: 'Test prompt', response: 'AI generated response' }
        ]
      };

      const mockSelect = jest.fn().mockResolvedValue(mockUpdatedStory);
      mockStoryFindById.mockReturnValue({
        select: mockSelect
      });

      mockUserModel.findById.mockResolvedValue(mockUser);
      axios.post.mockResolvedValue({ data: {} });

      await addpromptResponse(req, res);

      expect(mockUserModel.findById).toHaveBeenCalledWith('userId123');
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/story/continue',
        {
          story_id: 'validStoryId',
          user_id: 'userId123',
          user_action: 'Test prompt',
          api_key: 'test-api-key'
        }
      );
      expect(mockStoryFindById).toHaveBeenCalledWith('validStoryId');
      expect(mockSelect).toHaveBeenCalledWith('-ownerid');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        { content: mockUpdatedStory.content },
        'Story continued successfully'
      );
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if prompt is missing', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: 'test-api-key' 
      };
      mockUserModel.findById.mockResolvedValue(mockUser);
      req.body.prompt = '';

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApiError).toHaveBeenCalledWith(400, 'Prompt is required');
    });

    it('should return 403 if user has no API key', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: null
      };
      mockUserModel.findById.mockResolvedValue(mockUser);

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ApiError).toHaveBeenCalledWith(403, 'API key is required to continue a story.');
    });

    it('should return 404 if story not found after update', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: 'test-api-key' 
      };
      
      mockUserModel.findById.mockResolvedValue(mockUser);
      axios.post.mockResolvedValue({ data: {} });
      
      const mockSelect = jest.fn().mockResolvedValue(null);
      mockStoryFindById.mockReturnValue({
        select: mockSelect
      });

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(ApiError).toHaveBeenCalledWith(404, 'Story not found after update');
    });

    it('should handle empty prompt string', async () => {
      const mockUser = { _id: 'userId123', apiKey: 'test-api-key' };
      mockUserModel.findById.mockResolvedValue(mockUser);
      req.body.prompt = '';

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApiError).toHaveBeenCalledWith(400, 'Prompt is required');
    });

    it('should handle FastAPI errors gracefully', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: 'test-api-key' 
      };
      
      mockUserModel.findById.mockResolvedValue(mockUser);
      axios.post.mockRejectedValue({
        response: {
          status: 400,
          data: { detail: 'Invalid request' }
        }
      });

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to continue story via AI service.');
    });

    it('should handle generic errors', async () => {
      const mockUser = { 
        _id: 'userId123',
        apiKey: 'test-api-key' 
      };
      
      mockUserModel.findById.mockResolvedValue(mockUser);
      axios.post.mockRejectedValue(new Error('Network error'));

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to continue story via AI service.');
    });

    it('should handle user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      await addpromptResponse(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ApiError).toHaveBeenCalledWith(403, 'API key is required to continue a story.');
    });

    it("should trim story_id and call Story.findById with trimmed id", async () => {
      req.params.story_id = "   spacedId   "; // ensures trim() is required
      req.user._id = "userId123";

      const mockUser = { _id: "userId123", apiKey: "key123" };
      mockUserModel.findById.mockResolvedValue(mockUser);

      axios.post.mockResolvedValue({ data: {} });

      const mockSelect = jest.fn().mockResolvedValue({
        content: [{ prompt: "x", response: "y" }]
      });

      mockStoryFindById.mockReturnValue({
        select: mockSelect
      });

      await addpromptResponse(req, res);

      expect(mockStoryFindById).toHaveBeenCalledWith("spacedId"); // TRIM REQUIRED
      expect(mockSelect).toHaveBeenCalledWith("-ownerid");        // chain must exist
    });

  });
});

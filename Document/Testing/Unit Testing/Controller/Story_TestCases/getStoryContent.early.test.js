import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getStoryContent } from '../story.controller.js';

// Mock dependencies
jest.mock('../../models/Story.models.js', () => {
  const mockFindone = jest.fn();
  return {
    Story: {
      findOne: mockFindone
    }
  };
});

jest.mock('../../utils/ApiError.js', () => 
  jest.fn().mockImplementation((status, message) => ({ status, message }))
);

jest.mock('../../utils/ApiResponse.js', () => 
  jest.fn().mockImplementation((success, data, message) => ({ success, data, message }))
);

describe('getStoryContent() method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { story_id: '  validStoryId  ' } // With spaces to test trimming
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('Happy paths', () => {
    it('should return story content successfully', async () => {
      const mockStory = {
        _id: 'validStoryId',
        title: 'Test Story',
        description: 'Test Description',
        genre: 'Fantasy',
        content: [
          { prompt: 'Prompt 1', response: 'Response 1' },
          { prompt: 'Prompt 2', response: 'Response 2' }
        ],
        complete: false,
        public: false
      };

      const mockChain = {
        select: jest.fn().mockResolvedValue(mockStory)
      };

      Story.findOne.mockReturnValue(mockChain);

      await getStoryContent(req, res);

      expect(Story.findOne).toHaveBeenCalledWith({
        _id: 'validStoryId',
      });
      expect(mockChain.select).toHaveBeenCalledWith('-ownerid');
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        {
          _id: 'validStoryId',
          title: 'Test Story',
          description: 'Test Description',
          genre: 'Fantasy',
          content: mockStory.content,
          complete: false,
          public: false
        },
        'Story content fetched successfully'
      );
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if story ID is missing', async () => {
      req.params.story_id = null;

      await getStoryContent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApiError).toHaveBeenCalledWith(400, 'Story id is required');
    });

    it('should return 400 if story ID is empty after trimming', async () => {
      req.params.story_id = '   ';

      await getStoryContent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(ApiError).toHaveBeenCalledWith(400, 'Story id is required');
    });

    it('should return 404 if story is not found', async () => {
      const mockChain = {
        select: jest.fn().mockResolvedValue(null)
      };

      Story.findOne.mockReturnValue(mockChain);

      await getStoryContent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(ApiError).toHaveBeenCalledWith(404, 'Story not found or you are not the owner');
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Story.findOne.mockReturnValue(mockChain);

      await getStoryContent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to fetch story content');
    });

    it('should trim story ID before querying', async () => {
      req.params.story_id = '  storyWithSpaces  ';
      
      const mockChain = {
        select: jest.fn().mockResolvedValue(null)
      };
      Story.findOne.mockReturnValue(mockChain);

      await getStoryContent(req, res);

      expect(Story.findOne).toHaveBeenCalledWith({
        _id: 'storyWithSpaces',
      });
    });
  });
});
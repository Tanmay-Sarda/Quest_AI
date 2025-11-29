import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { deleteStory } from '../story.controller';

jest.mock("../../models/Story.models.js");

describe('deleteStory() deleteStory method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('Happy Paths', () => {
    test('should delete a story successfully when valid storyId and ownerId are provided', async () => {
      req.params.storyId = 'validStoryId';
      req.user._id = 'validOwnerId';

      const mockStory = {
        deleteOne: jest.fn(),
      };

      Story.findOne.mockResolvedValue(mockStory);

      await deleteStory(req, res);

      expect(Story.findOne).toHaveBeenCalledWith({
        _id: 'validStoryId',
        'ownerid.owner': 'validOwnerId',
      });
      expect(mockStory.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(200, null, 'Story deleted successfully'));
    });
  });

  describe('Edge Cases', () => {
    test('should return 400 error when storyId is not provided', async () => {
      req.user._id = 'validOwnerId';

      await deleteStory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(new ApiError(400, 'Story ID is required'));
    });

    test('should return 404 error when story is not found or user is not the owner', async () => {
      req.params.storyId = 'invalidStoryId';
      req.user._id = 'validOwnerId';

      Story.findOne.mockResolvedValue(null);

      await deleteStory(req, res);

      expect(Story.findOne).toHaveBeenCalledWith({
        _id: 'invalidStoryId',
        'ownerid.owner': 'validOwnerId',
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'Story not found or you are not the owner'));
    });

    test('should handle database errors gracefully', async () => {
      req.params.storyId = 'validStoryId';
      req.user._id = 'validOwnerId';

      Story.findOne.mockRejectedValue(new Error('Database error'));

      await deleteStory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(new ApiError(500, 'Failed to delete story'));
    });

    // ---------------------------------------------------------------
    // ensures trim(), optional chaining, and
    // findOne filter object are used exactly as intended.
    // ---------------------------------------------------------------
    test('should trim storyId and call findOne with exact filter object', async () => {
      req.params.storyId = '   spacedStoryId   ';
      req.user._id = 'owner123';

      const mockStory = { deleteOne: jest.fn() };
      Story.findOne.mockResolvedValue(mockStory);

      await deleteStory(req, res);

      // storyId?.trim() mutant killer → ensures TRIM IS ENFORCED
      expect(Story.findOne).toHaveBeenCalledWith({
        _id: 'spacedStoryId',
        'ownerid.owner': 'owner123'
      });
    });

  });
});

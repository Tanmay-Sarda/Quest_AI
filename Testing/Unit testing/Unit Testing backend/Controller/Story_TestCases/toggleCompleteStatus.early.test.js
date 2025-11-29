import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { toggleCompleteStatus } from '../story.controller.js';

jest.mock("../../models/Story.models.js");

describe('toggleCompleteStatus() toggleCompleteStatus method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { story_id: '123' },
      user: { _id: 'ownerId' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('Happy paths', () => {
    it('should toggle the complete status of a story from incomplete to complete', async () => {
      const story = {
        _id: '123',
        complete: false,
        save: jest.fn().mockResolvedValue(true)
      };
      Story.findOne.mockResolvedValue(story);

      await toggleCompleteStatus(req, res);

      expect(story.complete).toBe(true);
      expect(story.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(true, { _id: '123', complete: true }, 'Story marked as complete'));
    });

    it('should toggle the complete status of a story from complete to incomplete', async () => {
      const story = {
        _id: '123',
        complete: true,
        save: jest.fn().mockResolvedValue(true)
      };
      Story.findOne.mockResolvedValue(story);

      await toggleCompleteStatus(req, res);

      expect(story.complete).toBe(false);
      expect(story.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(true, { _id: '123', complete: false }, 'Story marked as incomplete'));
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if story_id is not provided', async () => {
      req.params.story_id = undefined;

      await toggleCompleteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(new ApiError(400, 'Story id is required'));
    });

    it('should return 404 if the story is not found', async () => {
      Story.findOne.mockResolvedValue(null);

      await toggleCompleteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'Story not found or you are not the owner'));
    });

    it('should handle errors during database operations', async () => {
      Story.findOne.mockRejectedValue(new Error('Database error'));

      await toggleCompleteStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(new ApiError(500, 'Failed to toggle story status'));
    });
  });


    it('should trim story_id and call Story.findOne with correct query', async () => {
    req.params.story_id = '   spacedID   ';
    req.user._id = 'ownerId';

    const story = {
      _id: 'spacedID',
      complete: false,
      save: jest.fn().mockResolvedValue(true)
    };

    Story.findOne.mockResolvedValue(story);

    await toggleCompleteStatus(req, res);

    const calls = Story.findOne.mock.calls;

    expect(
      calls.some(call => {
        const q = call[0];

        return (
          String(q._id).includes('spacedID') &&
          String(q['ownerid.owner']).includes('ownerId')
        );
      })
    ).toBe(true);

    expect(story.complete).toBe(true);
    expect(story.save).toHaveBeenCalled();
  });


});

import mongoose from 'mongoose';
import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { changeAccess } from '../story.controller.js';

jest.mock("../../models/Story.models.js");

describe('changeAccess() changeAccess method', () => {
  let req, res, ownerId, storyId, story;

  beforeEach(() => {
    ownerId = new mongoose.Types.ObjectId();
    storyId = new mongoose.Types.ObjectId();
    req = {
      params: { story_id: storyId.toString() },
      user: { _id: ownerId }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    story = {
      _id: storyId,
      ownerid: [{ owner: ownerId }],
      public: false,
      save: jest.fn()
    };
  });

  describe('Happy paths', () => {
    it('should change story access from private to public', async () => {
      Story.findOne.mockResolvedValue(story);

      await changeAccess(req, res);

      expect(story.public).toBe(true);
      expect(story.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(true, { _id: storyId, public: true }, 'Story access changed to public'));
    });

    it('should change story access from public to private', async () => {
      story.public = true;
      Story.findOne.mockResolvedValue(story);

      await changeAccess(req, res);

      expect(story.public).toBe(false);
      expect(story.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new ApiResponse(true, { _id: storyId, public: false }, 'Story access changed to private'));
    });
  });

  describe('Edge cases', () => {
    it('should return 400 if story_id is not provided', async () => {
      req.params.story_id = undefined;

      await changeAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(new ApiError(400, 'Story id is required'));
    });

    it('should return 404 if story is not found', async () => {
      Story.findOne.mockResolvedValue(null);

      await changeAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(new ApiError(404, 'Story not found or you are not the owner'));
    });

    it('should return 403 if user is not the main owner', async () => {
      story.ownerid[0].owner = new mongoose.Types.ObjectId();
      Story.findOne.mockResolvedValue(story);

      await changeAccess(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(new ApiError(403, 'Only the main owner can change access'));
    });
  });

  
    it('should trim story_id and call Story.findOne with correct query', async () => {
    req.params.story_id = '    ' + storyId.toString() + '   ';

    const storyClone = {
      _id: storyId,
      ownerid: [{ owner: ownerId }],
      public: false,
      save: jest.fn()
    };

    Story.findOne.mockResolvedValue(storyClone);

    await changeAccess(req, res);

    const calls = Story.findOne.mock.calls;

    expect(
      calls.some(call => {
        const q = call[0];

        return (
          String(q._id) === storyId.toString().trim() ||
          String(q._id).includes(storyId.toString().trim())
        ) && (
          String(q['ownerid.owner']) === ownerId.toString()
        );
      })
    ).toBe(true);

    expect(storyClone.save).toHaveBeenCalled();
  });


});

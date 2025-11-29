import mongoose from 'mongoose';
import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getincomplete } from '../story.controller.js';

jest.mock('../../models/Story.models.js');

// Mock utils with proper implementations
jest.mock('../../utils/ApiError.js', () => 
  jest.fn().mockImplementation((status, message) => ({ 
    status, 
    message,
    success: false 
  }))
);

jest.mock('../../utils/ApiResponse.js', () => 
  jest.fn().mockImplementation((status, data, message) => ({ 
    status, 
    data, 
    message,
    success: true 
  }))
);

describe('getincomplete() getincomplete method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: new mongoose.Types.ObjectId() }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('Edge cases for line 160 coverage', () => {
    it('should handle stories where no matching owner entry is found', async () => {
      const userId = req.user._id;

      // Mock ObjectId that returns false for equals
      const mockDifferentOwnerId = {
        equals: jest.fn().mockReturnValue(false) // Different owner
      };

      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [
            {
              owner: mockDifferentOwnerId, // Different owner, won't match
              character: 'Character 1'
            }
          ],
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      const apiResponseCall = ApiResponse.mock.calls[0];
      const responseData = apiResponseCall[1]; // Second argument is data
      
      expect(responseData[0].character).toBeNull();
    });

    it('should handle stories with empty ownerid array', async () => {
      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [], // Empty ownerid array
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      const apiResponseCall = ApiResponse.mock.calls[0];
      const responseData = apiResponseCall[1];
      
      expect(responseData[0].character).toBeNull();
    });

    it('should handle stories with undefined ownerid', async () => {
      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: undefined, // Undefined ownerid
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      const apiResponseCall = ApiResponse.mock.calls[0];
      const responseData = apiResponseCall[1];
      
      expect(responseData[0].character).toBeNull();
    });

    it('should handle stories with null ownerid', async () => {
      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: null, // Null ownerid
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      const apiResponseCall = ApiResponse.mock.calls[0];
      const responseData = apiResponseCall[1];
      
      expect(responseData[0].character).toBeNull();
    });

    it('should handle stories with multiple owners but no matching one', async () => {
      const userId = req.user._id;

      // Mock ObjectIds - none match the current user
      const mockOwner1 = { equals: jest.fn().mockReturnValue(false) };
      const mockOwner2 = { equals: jest.fn().mockReturnValue(false) };

      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [
            {
              owner: mockOwner1,
              character: 'Character 1'
            },
            {
              owner: mockOwner2, 
              character: 'Character 2'
            }
          ],
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      const apiResponseCall = ApiResponse.mock.calls[0];
      const responseData = apiResponseCall[1];
      
      expect(responseData[0].character).toBeNull();
    });
  });

  describe('Happy paths', () => {
    it('should return incomplete stories for the authenticated user', async () => {
      const userId = req.user._id;

      const mockStories = [
        {
          _id: new mongoose.Types.ObjectId(),
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [{ owner: userId, character: 'Character 1' }],
          complete: false,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: new mongoose.Types.ObjectId(),
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: false
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getincomplete(req, res);

      expect(Story.find).toHaveBeenCalledWith({
        'ownerid.owner': userId,
        complete: false
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should call Story.find().select().sort() with correct arguments", async () => {
      const userId = req.user._id;

      const mockStories = [];

      const mockSelect = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockStories);

      Story.find.mockReturnValue({
        select: mockSelect,
        sort: mockSort,
      });

      await getincomplete(req, res);

      expect(Story.find).toHaveBeenCalledWith({
        "ownerid.owner": userId,
        complete: false,
      });

      expect(mockSelect).toHaveBeenCalledWith("-prompt -response");

      expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  describe('Edge cases', () => {
    it('should return 403 if user is not authenticated', async () => {
      req.user = null;
      await getincomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(ApiError).toHaveBeenCalledWith(403, 'Login is required to do this functionality');
    });

    it('should handle no incomplete stories gracefully', async () => {
      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await getincomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(200, [], 'Incomplete stories fetched successfully');
    });

    it('should handle database errors gracefully', async () => {
      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getincomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to fetch stories');
    });
  });

});

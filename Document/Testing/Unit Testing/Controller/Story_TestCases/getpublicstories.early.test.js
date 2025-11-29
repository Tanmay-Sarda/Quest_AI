import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getpublicstories } from '../story.controller.js';

// Mock setup - use jest.mock properly
jest.mock('../../models/Story.models.js', () => {
  const mockFind = jest.fn();
  return {
    Story: {
      find: mockFind
    }
  };
});

jest.mock('../../utils/ApiError.js', () => {
  return jest.fn().mockImplementation((statusCode, message) => ({
    statusCode,
    message,
    success: false,
    data: null
  }));
});

jest.mock('../../utils/ApiResponse.js', () => {
  return jest.fn().mockImplementation((statusCode, data, message) => ({
    statusCode,
    data,
    message,
    success: true
  }));
});

describe('getpublicstories() getpublicstories method', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Clear mocks properly
    if (Story && Story.find) {
      Story.find.mockReset();
    }
    jest.clearAllMocks();
  });

  describe('Happy paths', () => {
    it('should return public stories successfully', async () => {
      const mockStories = [
        {
          _id: '1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [{
            owner: { email: 'owner1@example.com' },
            character: 'Character 1'
          }],
          public: true,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: '1',
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            ownerid: [{
              owner: { email: 'owner1@example.com' },
              character: 'Character 1'
            }],
            public: true,
            createdAt: expect.any(Date)
          })
        }
      ];

      // Create a proper mock chain
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getpublicstories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        200,
        expect.arrayContaining([
          expect.objectContaining({
            _id: '1',
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            character: 'Character 1',
            email: 'owner1@example.com'
          })
        ]),
        'Public stories fetched successfully'
      );
    });

    // ---------------------------------------------------------
    //  ⭐ Added mutation killer test for select().populate().sort()
    // ---------------------------------------------------------
    it('should call find().select().populate().sort() with correct args', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([]) // no story needed
      };

      Story.find.mockReturnValue(mockChain);

      await getpublicstories(req, res);

      expect(Story.find).toHaveBeenCalledWith({ public: true });
      expect(mockChain.select).toHaveBeenCalledWith('-prompt -response');
      expect(mockChain.populate).toHaveBeenCalledWith('ownerid.owner', 'email');
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

  });

  describe('Edge cases', () => {
    it('should return an empty list if no public stories are found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Story.find.mockReturnValue(mockChain);

      await getpublicstories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        200,
        [],
        'Public stories fetched successfully'
      );
    });

    it('should handle stories with empty ownerid', async () => {
      const mockStories = [
        {
          _id: '1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          ownerid: [], // Empty ownerid array
          public: true,
          createdAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: '1',
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            ownerid: [],
            public: true,
            createdAt: expect.any(Date)
          })
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getpublicstories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        200,
        expect.arrayContaining([
          expect.objectContaining({
            _id: '1',
            title: 'Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            character: null,
            email: null
          })
        ]),
        'Public stories fetched successfully'
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Story.find.mockReturnValue(mockChain);

      await getpublicstories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to fetch stories');
    });
  });
});

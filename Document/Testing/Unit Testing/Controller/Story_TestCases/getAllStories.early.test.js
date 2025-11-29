import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getAllStories } from '../story.controller.js';

// Mock dependencies
jest.mock('../../models/Story.models.js', () => {
  const mockFind = jest.fn();
  return {
    Story: {
      find: mockFind
    }
  };
});

jest.mock('../../utils/ApiError.js', () => 
  jest.fn().mockImplementation((success, message) => ({ success, message }))
);

jest.mock('../../utils/ApiResponse.js', () => 
  jest.fn().mockImplementation((success, data, message) => ({ success, data, message }))
);

describe('getAllStories() method', () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { _id: 'userId123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Happy paths', () => {
    it('should return all stories for authenticated user', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: [
            { 
              owner: { 
                equals: jest.fn().mockImplementation((id) => id === 'userId123')
              }, 
              character: 'Character 1' 
            }
          ],
          complete: false,
          createdAt: new Date(),
          content: [{}, {}]
        }
      ];

      // Create a proper mock chain that resolves correctly
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(Story.find).toHaveBeenCalledWith({ "ownerid.owner": 'userId123' });
      expect(mockChain.select).toHaveBeenCalledWith('-ownerid');
      expect(mockChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        expect.arrayContaining([
          expect.objectContaining({
            _id: 'story1',
            title: 'Story 1',
            character: 'Character 1',
            contentCount: 2
          })
        ]),
        'Stories fetched successfully'
      );
    });

    it('should return empty array when user has no stories', async () => {
      // Create a proper mock chain that resolves with empty array
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [],
        'Stories fetched successfully'
      );
    });
  });

  describe('Edge cases', () => {
    it('should return 401 if user is not authenticated', async () => {
      req.user = null;

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(ApiError).toHaveBeenCalledWith(401, 'Unauthorized: User not authenticated');
    });

    it('should handle stories with no matching owner entry', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: [
            { 
              owner: { 
                equals: jest.fn().mockImplementation((id) => id === 'otherUser')
              }, 
              character: 'Character 1' 
            }
          ],
          complete: false,
          createdAt: new Date(),
          content: []
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [
          expect.objectContaining({
            _id: 'story1',
            character: null, // Should be null since no matching owner
            contentCount: 0
          })
        ],
        'Stories fetched successfully'
      );
    });

    it('should handle stories with empty ownerid array', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: [], // Empty ownerid array
          complete: false,
          createdAt: new Date(),
          content: [{}, {}]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [
          expect.objectContaining({
            _id: 'story1',
            character: null, // Should be null with empty ownerid
            contentCount: 2
          })
        ],
        'Stories fetched successfully'
      );
    });

    it('should handle database errors gracefully', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(ApiError).toHaveBeenCalledWith(500, 'Failed to fetch stories');
    });
  });

  describe('Edge cases for line 134', () => {
    it('should handle stories with undefined content array', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: [
            { 
              owner: { 
                equals: jest.fn().mockImplementation((id) => id === 'userId123')
              }, 
              character: 'Character 1' 
            }
          ],
          complete: false,
          createdAt: new Date(),
          content: undefined // Undefined content
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [
          expect.objectContaining({
            _id: 'story1',
            contentCount: 0 // Should be 0 for undefined content
          })
        ],
        'Stories fetched successfully'
      );
    });

    it('should handle stories with null content array', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: [
            { 
              owner: { 
                equals: jest.fn().mockImplementation((id) => id === 'userId123')
              }, 
              character: 'Character 1' 
            }
          ],
          complete: false,
          createdAt: new Date(),
          content: null // Null content
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [
          expect.objectContaining({
            _id: 'story1',
            contentCount: 0 // Should be 0 for null content
          })
        ],
        'Stories fetched successfully'
      );
    });

    it('should handle optional chaining with undefined ownerid', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Story 1',
          description: 'Description 1',
          genre: 'Fantasy',
          ownerid: undefined, // Undefined ownerid
          complete: false,
          createdAt: new Date(),
          content: [{}, {}]
        }
      ];

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      };

      Story.find.mockReturnValue(mockChain);

      await getAllStories(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(ApiResponse).toHaveBeenCalledWith(
        true,
        [
          expect.objectContaining({
            _id: 'story1',
            character: null, // Should be null with undefined ownerid
            contentCount: 2
          })
        ],
        'Stories fetched successfully'
      );
    });
  });
});
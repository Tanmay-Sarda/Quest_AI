import { Story } from '../../models/Story.models.js';
import ApiError from '../../utils/ApiError.js';
import ApiResponse from '../../utils/ApiResponse.js';
import { getcomplete } from '../story.controller.js';

// Mock Story model
jest.mock('../../models/Story.models.js', () => ({
  Story: {
    find: jest.fn()
  }
}));

describe('getcomplete() getcomplete method', () => {
  let req, res;

  beforeEach(() => {
    req = { user: { _id: 'user123' } };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  });

  // -----------------------------------------------------
  // HAPPY PATH
  // -----------------------------------------------------
  describe('Happy paths', () => {
    it('should return complete stories for authenticated user', async () => {
      // Mock ObjectId with .equals()
      const mockOwnerId = { equals: (other) => other === 'user123' };

      const mockStories = [
        {
          _id: 'story1',
          title: 'Completed Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          complete: true,
          ownerid: [{ owner: mockOwnerId, character: 'Character 1' }],
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: 'story1',
            title: 'Completed Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: true
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getcomplete(req, res);

      expect(Story.find).toHaveBeenCalledWith({
        'ownerid.owner': 'user123',
        complete: true
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(
          200,
          mockStories.map((s) => ({
            _id: s._id,
            title: s.title,
            description: s.description,
            genre: s.genre,
            complete: s.complete,
            character: s.ownerid[0].character
          })),
          'Complete stories fetched successfully'
        )
      );
    });

    it("should call Story.find, select, and sort with correct arguments (mutation killer)", async () => {
      const mockStories = [];

      const mockSelect = jest.fn().mockReturnThis();
      const mockSort = jest.fn().mockResolvedValue(mockStories);

      Story.find.mockReturnValue({
        select: mockSelect,
        sort: mockSort,
      });

      await getcomplete(req, res);

      expect(Story.find).toHaveBeenCalledWith({
        "ownerid.owner": "user123",
        complete: true,
      });

      expect(mockSelect).toHaveBeenCalledWith("-prompt -response");

      expect(mockSort).toHaveBeenCalledWith({ updatedAt: -1 });
    });
  });

  // -----------------------------------------------------
  // EDGE CASES FOR OWNER MATCH
  // -----------------------------------------------------
  describe('Edge cases for line 131 coverage', () => {
    it('should handle stories where no matching owner entry is found', async () => {
      const mockOwnerId = { equals: jest.fn().mockReturnValue(false) };

      const mockStories = [
        {
          _id: 'story1',
          title: 'Completed Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          complete: true,
          ownerid: [{ owner: mockOwnerId, character: 'Character 1' }],
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: 'story1',
            title: 'Completed Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: true,
            ownerid: [{ owner: mockOwnerId, character: 'Character 1' }]
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getcomplete(req, res);

      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(
          200,
          [
            expect.objectContaining({
              _id: 'story1',
              character: null
            })
          ],
          'Complete stories fetched successfully'
        )
      );
    });

    it('should handle stories with empty ownerid array', async () => {
      const mockStories = [
        {
          _id: 'story1',
          title: 'Completed Story 1',
          description: 'Description 1',
          genre: 'Genre 1',
          complete: true,
          ownerid: [],
          updatedAt: new Date(),
          toObject: jest.fn().mockReturnValue({
            _id: 'story1',
            title: 'Completed Story 1',
            description: 'Description 1',
            genre: 'Genre 1',
            complete: true,
            ownerid: []
          })
        }
      ];

      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockStories)
      });

      await getcomplete(req, res);

      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(
          200,
          [
            expect.objectContaining({
              _id: 'story1',
              character: null
            })
          ],
          'Complete stories fetched successfully'
        )
      );
    });
  });

  // -----------------------------------------------------
  // GENERAL EDGE CASES
  // -----------------------------------------------------
  describe('Edge cases', () => {
    it('should return 403 if user is not authenticated', async () => {
      req.user = null;

      await getcomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        new ApiError(403, 'Login is required to do this functionality')
      );
    });

    it('should handle no complete stories found', async () => {
      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([])
      });

      await getcomplete(req, res);

      expect(Story.find).toHaveBeenCalledWith({
        'ownerid.owner': 'user123',
        complete: true
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        new ApiResponse(200, [], 'Complete stories fetched successfully')
      );
    });

    it('should handle database errors gracefully', async () => {
      Story.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      await getcomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        new ApiError(500, 'Failed to fetch stories')
      );
    });
  });
});

import { v2 as cloudinary } from 'cloudinary';
import { deleteCloudinary } from '../cloudanary.js';

// Mock cloudinary
jest.mock('cloudinary');

describe('deleteCloudinary', () => {
  const mockPublicId = 'test-public-id';
  const mockDeleteResponse = {
    result: 'ok'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful deletions', () => {
    it('should delete file from Cloudinary successfully with default resource type', async () => {
      // Setup
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      const result = await deleteCloudinary(mockPublicId);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        resource_type: 'image'
      });
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should delete file from Cloudinary successfully with custom resource type', async () => {
      // Setup
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      const result = await deleteCloudinary(mockPublicId, 'video');

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        resource_type: 'video'
      });
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should delete file with raw resource type', async () => {
      // Setup
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      const result = await deleteCloudinary(mockPublicId, 'raw');

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        resource_type: 'raw'
      });
      expect(result).toEqual(mockDeleteResponse);
    });

    it('should delete file with auto resource type', async () => {
      // Setup
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      const result = await deleteCloudinary(mockPublicId, 'auto');

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        resource_type: 'auto'
      });
      expect(result).toEqual(mockDeleteResponse);
    });
  });

  describe('Input validation', () => {
    it('should throw error when public ID is null', async () => {
      // Execute & Assert
      await expect(deleteCloudinary(null)).rejects.toThrow('Public ID is required for deletion');
      
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should throw error when public ID is undefined', async () => {
      // Execute & Assert
      await expect(deleteCloudinary(undefined)).rejects.toThrow('Public ID is required for deletion');
      
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should throw error when public ID is empty string', async () => {
      // Execute & Assert
      await expect(deleteCloudinary('')).rejects.toThrow('Public ID is required for deletion');
      
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });

    it('should throw error when public ID is whitespace only', async () => {
      // Execute & Assert
      await expect(deleteCloudinary('   ')).rejects.toThrow('Public ID is required for deletion');
      
      expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should handle Cloudinary deletion failure', async () => {
      // Setup
      const deletionError = new Error('Cloudinary deletion failed');
      cloudinary.uploader.destroy.mockRejectedValue(deletionError);

      // Execute & Assert
      await expect(deleteCloudinary(mockPublicId)).rejects.toThrow('Cloudinary deletion failed');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
        resource_type: 'image'
      });
    });

    it('should handle specific Cloudinary API errors', async () => {
      // Setup
      const cloudinaryError = new Error('Invalid public_id');
      cloudinaryError.http_code = 400;
      cloudinaryError.name = 'BadRequest';
      
      cloudinary.uploader.destroy.mockRejectedValue(cloudinaryError);

      // Execute & Assert
      await expect(deleteCloudinary('invalid-public-id')).rejects.toThrow('Invalid public_id');

      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('invalid-public-id', {
        resource_type: 'image'
      });
    });

    it('should handle not found errors from Cloudinary', async () => {
      // Setup
      const notFoundError = new Error('Resource not found');
      notFoundError.http_code = 404;
      
      cloudinary.uploader.destroy.mockRejectedValue(notFoundError);

      // Execute & Assert
      await expect(deleteCloudinary('non-existent-id')).rejects.toThrow('Resource not found');
    });

    it('should handle authorization errors from Cloudinary', async () => {
      // Setup
      const authError = new Error('Authorization failed');
      authError.http_code = 401;
      
      cloudinary.uploader.destroy.mockRejectedValue(authError);

      // Execute & Assert
      await expect(deleteCloudinary(mockPublicId)).rejects.toThrow('Authorization failed');
    });

    it('should handle network errors', async () => {
      // Setup
      const networkError = new Error('Network error');
      cloudinary.uploader.destroy.mockRejectedValue(networkError);

      // Execute & Assert
      await expect(deleteCloudinary(mockPublicId)).rejects.toThrow('Network error');
    });
  });

  describe('Edge cases', () => {
    it('should handle public IDs with special characters', async () => {
      // Setup
      const specialPublicId = 'test@public#id$123';
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      await deleteCloudinary(specialPublicId);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(specialPublicId, {
        resource_type: 'image'
      });
    });

    it('should handle very long public IDs', async () => {
      // Setup
      const longPublicId = 'a'.repeat(500);
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      await deleteCloudinary(longPublicId);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(longPublicId, {
        resource_type: 'image'
      });
    });

    it('should handle public IDs with slashes (nested folders)', async () => {
      // Setup
      const nestedPublicId = 'folder/subfolder/test-image';
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      await deleteCloudinary(nestedPublicId);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(nestedPublicId, {
        resource_type: 'image'
      });
    });

    it('should handle different Cloudinary response formats', async () => {
      // Setup
      const alternativeResponse = {
        result: 'not found'
      };
      cloudinary.uploader.destroy.mockResolvedValue(alternativeResponse);

      // Execute
      const result = await deleteCloudinary(mockPublicId);

      // Assert
      expect(result).toEqual(alternativeResponse);
    });

    it('should handle public IDs with spaces', async () => {
      // Setup
      const publicIdWithSpaces = 'test public id with spaces';
      cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);

      // Execute
      await deleteCloudinary(publicIdWithSpaces);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(publicIdWithSpaces, {
        resource_type: 'image'
      });
    });
  });

  describe('Resource type variations', () => {
    it('should handle all valid resource types', async () => {
      const resourceTypes = ['image', 'video', 'raw', 'auto'];
      
      for (const resourceType of resourceTypes) {
        cloudinary.uploader.destroy.mockResolvedValue(mockDeleteResponse);
        
        await deleteCloudinary(mockPublicId, resourceType);
        
        expect(cloudinary.uploader.destroy).toHaveBeenCalledWith(mockPublicId, {
          resource_type: resourceType
        });
        
        jest.clearAllMocks();
      }
    });
  });
});
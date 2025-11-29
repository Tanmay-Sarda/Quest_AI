
import asyncHandler from '../AsyncHandler';


// Import the asyncHandler function from the AsyncHandler.js file
describe('asyncHandler() asyncHandler method', () => {
  // Happy path tests
  describe('Happy Paths', () => {
    test('should call the request handler and resolve successfully', async () => {
      // Setup: Create a mock request handler that resolves successfully
      const mockRequestHandler = jest.fn(() => Promise.resolve('success'));
      const req = {};
      const res = {};
      const next = jest.fn();

      // Wrap the mock request handler with asyncHandler
      const wrappedHandler = asyncHandler(mockRequestHandler);

      // Execute the wrapped handler
      await wrappedHandler(req, res, next);

      // Assert: Ensure the request handler was called and next was not called
      expect(mockRequestHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    test('should pass the error to next if the request handler throws an error', async () => {
      // Setup: Create a mock request handler that throws an error
      const error = new Error('Test error');
      const mockRequestHandler = jest.fn(() => Promise.reject(error));
      const req = {};
      const res = {};
      const next = jest.fn();

      // Wrap the mock request handler with asyncHandler
      const wrappedHandler = asyncHandler(mockRequestHandler);

      // Execute the wrapped handler
      await wrappedHandler(req, res, next);

      // Assert: Ensure the error was passed to next
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    test('should handle synchronous errors thrown by the request handler', async () => {
      // Setup: Create a mock request handler that throws a synchronous error
      const error = new Error('Synchronous error');
      const mockRequestHandler = jest.fn(() => {
        throw error;
      });
      const req = {};
      const res = {};
      const next = jest.fn();

      // Wrap the mock request handler with asyncHandler
      const wrappedHandler = asyncHandler(mockRequestHandler);

      // Execute the wrapped handler
      await wrappedHandler(req, res, next);

      // Assert: Ensure the synchronous error was passed to next
      expect(next).toHaveBeenCalledWith(error);
    });

    test('should handle request handler returning a non-promise value', async () => {
      // Setup: Create a mock request handler that returns a non-promise value
      const mockRequestHandler = jest.fn(() => 'non-promise value');
      const req = {};
      const res = {};
      const next = jest.fn();

      // Wrap the mock request handler with asyncHandler
      const wrappedHandler = asyncHandler(mockRequestHandler);

      // Execute the wrapped handler
      await wrappedHandler(req, res, next);

      // Assert: Ensure the request handler was called and next was not called
      expect(mockRequestHandler).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
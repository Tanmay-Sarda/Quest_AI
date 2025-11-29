const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    try {
      // If the requestHandler returns a promise, handle it with .catch
      // If it throws a synchronous error, catch it in the try-catch
      const result = requestHandler(req, res, next);
      
      // Check if it's a promise
      if (result instanceof Promise) {
        return result.catch((error) => {
          console.error(`Error: ${error.message}`);
          next(error);
        });
      }
      
      return result;
    } catch (error) {
      // Handle synchronous errors
      console.error(`Error: ${error.message}`);
      next(error);
    }
  };
};

export default asyncHandler;
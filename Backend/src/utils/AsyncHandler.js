
//This is use for handling asynchronous route handlers in Express.js applications.
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      console.error(`Error: ${error.message}`); // log the error
      next(error); // ✅ pass error to Express error handler
    });
  };
};

export default asyncHandler;

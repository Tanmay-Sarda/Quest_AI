
class ApiError{
  constructor(statusCode,message="Somthing went wrong",error=[],stack="") {
    this.statusCode = statusCode; // Set the HTTP status code
    this.data=null; // Initialize data to null
    this.message=message; // Set the message for the error
    this.success = false; // Indicates that the operation was not successful
    this.error=error; // Store the error details
    

    //Stack use for debugging purposes they provide function call stack at the point where the error was thrown,line number, and file name
    if(stack) {
      this.stack = stack; // Store the stack trace if provided 
    }else{
        Error.captureStackTrace(this, this.constructor); // Capture the stack trace if not provided 
    }
  }         
}

export default ApiError;
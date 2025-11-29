class ApiError {
  constructor(statusCode, message, error = []) {
    this.statusCode = statusCode;
    this.message = message;
    this.error = error;   // <-- YOU FORGOT THIS LINE
  }
}

export default ApiError;
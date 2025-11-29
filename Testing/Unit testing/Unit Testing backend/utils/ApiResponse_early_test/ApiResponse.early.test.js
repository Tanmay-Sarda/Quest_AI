// ApiResponse.test.js
import ApiResponse from '../ApiResponse.js';

describe('ApiResponse Class', () => {
    test('should initialize correctly with default message', () => {
        const statuscode = 200;
        const data = { id: 1, name: 'Test' };

        const response = new ApiResponse(statuscode, data);

        expect(response.statuscode).toBe(statuscode);
        expect(response.data).toEqual(data);
        expect(response.message).toBe('Operation successful');
        expect(response.success).toBe(true); // statuscode < 400
    });

    test('should initialize correctly with custom message', () => {
        const statuscode = 201;
        const data = { id: 2, name: 'Custom Test' };
        const message = 'Custom message';

        const response = new ApiResponse(statuscode, data, message);

        expect(response.statuscode).toBe(statuscode);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
        expect(response.success).toBe(true); // statuscode < 400
    });

    test('should set success to false for status codes >= 400', () => {
        const statuscode = 404;
        const data = null;

        const response = new ApiResponse(statuscode, data);

        expect(response.statuscode).toBe(statuscode);
        expect(response.data).toBeNull();
        expect(response.message).toBe('Operation successful');
        expect(response.success).toBe(false); // statuscode >= 400
    });
});

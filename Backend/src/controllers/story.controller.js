import axios from 'axios';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHandler.js';
import { Story } from '../models/Story.models.js';


const createStory = asyncHandler(async (req, res) => {
    const { title, description, character } = req.body;
    const ownerId = req.user?._id;

    if (!ownerId) {
        return res.status(401).json(new ApiError(401, 'Unauthorized: User not authenticated'));
    }

    if (!title || !description || !character) {
        return res.status(400).json(new ApiError(400, 'Title, description, and character name are required'));
    }

    try {
        const newStory = await Story.create({
            title,
            description,
            ownerid: [{
                owner: ownerId,
                character: character
            }],
            content: [],
            complete: false,
            public: false
        });

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        // Send story_id 
        res.write(`data: ${JSON.stringify({ 
            type: 'story_created', 
            story_id: newStory._id.toString(),
            title: newStory.title 
        })}\n\n`);

        const fastApiRequestData = {
            name: title,
            description: description,
            owner: {
                owner: ownerId.toString(),
                character: character
            }
        };

        // Call FastAPI with streaming
        const aiResponse = await axios.post(
            `${process.env.FASTAPI_URL}/story/new/stream`,
            fastApiRequestData,
            { responseType: 'stream' }
        );

        let buffer = '';
        let fullResponse = '';

        // Stream chunks to client
        aiResponse.data.on('data', (chunk) => {
            const text = chunk.toString();
            buffer += text;
            fullResponse += text;

            // Send chunk to frontend
            res.write(`data: ${JSON.stringify({ 
                type: 'content_chunk', 
                chunk: text 
            })}\n\n`);
        });

        // Save to MongoDB when complete
        aiResponse.data.on('end', async () => {
            try {
                await Story.findByIdAndUpdate(newStory._id, {
                    $push: {
                        content: {
                            prompt: `Starting scene for ${title}`,
                            user: ownerId,
                            response: fullResponse
                        }
                    }
                });

                res.write(`data: ${JSON.stringify({ 
                    type: 'complete', 
                    story_id: newStory._id.toString() 
                })}\n\n`);
                
                res.end();
            } catch (error) {
                console.error('Error saving story:', error);
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    message: 'Failed to save story' 
                })}\n\n`);
                res.end();
            }
        });

        aiResponse.data.on('error', (error) => {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                message: error.message 
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error("Error creating story:", error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.detail || 'Failed to create story via AI service.';
        return res.status(statusCode).json(new ApiError(statusCode, message));
    }
});

const addPromptResponse = asyncHandler(async (req, res) => {
    const { story_id } = req.params;
    const { prompt } = req.body;
    const userId = req.user?._id;

    if (!prompt) {
        return res.status(400).json(new ApiError(400, 'Prompt is required'));
    }

    try {
        // Verify story exists and user has access
        const story = await Story.findOne({
            _id: story_id,
            "ownerid": { $elemMatch: { owner: userId } }
        });

        if (!story) {
            return res.status(404).json(new ApiError(404, 'Story not found or access denied'));
        }

        // Set up SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const fastApiRequestData = {
            story_id: story_id,
            user_id: userId.toString(),
            user_action: prompt
        };

        const aiResponse = await axios.post(
            `${process.env.FASTAPI_URL}/story/continue/stream`,
            fastApiRequestData,
            { responseType: 'stream' }
        );

        let fullResponse = '';

        aiResponse.data.on('data', (chunk) => {
            const text = chunk.toString();
            fullResponse += text;

            res.write(`data: ${JSON.stringify({ 
                type: 'content_chunk', 
                chunk: text 
            })}\n\n`);
        });

        aiResponse.data.on('end', async () => {
            try {
                await Story.findByIdAndUpdate(story_id, {
                    $push: {
                        content: {
                            prompt: prompt,
                            user: userId,
                            response: fullResponse
                        }
                    }
                });

                res.write(`data: ${JSON.stringify({ 
                    type: 'complete' 
                })}\n\n`);
                
                res.end();
            } catch (error) {
                console.error('Error updating story:', error);
                res.write(`data: ${JSON.stringify({ 
                    type: 'error', 
                    message: 'Failed to save response' 
                })}\n\n`);
                res.end();
            }
        });

        aiResponse.data.on('error', (error) => {
            console.error('Stream error:', error);
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                message: error.message 
            })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error("Error continuing story:", error.response?.data || error.message);
        const statusCode = error.response?.status || 500;
        const message = error.response?.data?.detail || 'Failed to continue story via AI service.';
        return res.status(statusCode).json(new ApiError(statusCode, message));
    }
});

const getAllStories = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    if (!owner) {
        return res.status(401).json(new ApiError(401, 'Unauthorized: User not authenticated'));
    }

    const stories = await Story.find({
        "ownerid": { $elemMatch: { owner: owner } }
    }).select('-ownerid');
    
    res.status(200).json(new ApiResponse(true, stories, 'Stories fetched successfully'));
});

const getComplete = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    if (!owner) {
        return res.status(403).json(new ApiError(403, 'Login is required'));
    }

    const stories = await Story.find({
        "ownerid": { $elemMatch: { owner: owner } },
        complete: true
    }).select('-ownerid');

    return res.status(200).json(new ApiResponse(200, stories, 'Complete stories fetched successfully'));
});

const getIncomplete = asyncHandler(async (req, res) => {
    const owner = req.user?._id;
    if (!owner) {
        return res.status(403).json(new ApiError(403, 'Login is required'));
    }

    const stories = await Story.find({
        "ownerid": { $elemMatch: { owner: owner } },
        complete: false
    }).select('-ownerid');

    return res.status(200).json(new ApiResponse(200, stories, 'Incomplete stories fetched successfully'));
});

const toggleCompleteStatus = asyncHandler(async (req, res) => {
    const { story_id } = req.params;
    const owner = req.user?._id;

    if (!story_id) {
        return res.status(400).json(new ApiError(400, 'Story id is required'));
    }

    const story = await Story.findOne({
        _id: story_id,
        "ownerid": { $elemMatch: { owner: owner } }
    });
    
    if (!story) {
        return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
    }

    story.complete = !story.complete;
    await story.save();
    
    res.status(200).json(new ApiResponse(true, story, `Story marked as ${story.complete ? 'complete' : 'incomplete'}`));
});

export { 
    createStory, 
    getAllStories, 
    getComplete, 
    getIncomplete, 
    addPromptResponse, 
    toggleCompleteStatus 
};
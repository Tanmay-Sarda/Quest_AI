import axios from 'axios';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHandler.js';
import { Story } from '../models/Story.models.js';
import mongoose from 'mongoose';


const createStory = asyncHandler(async (req, res) => {
  console.log("createStory called");
  const { title, description, character, genre } = req.body;
  const ownerId = req.user?._id;

  if (!ownerId) {
    return res.status(401).json(new ApiError(401, 'Unauthorized: User not authenticated'));
  }

  if (!title || !description || !character) {
    return res.status(400).json(new ApiError(400, 'Title, description, and character name are required'));
  }

  try {
    // Call FastAPI to generate initial story content
    const fastApiRequestData = {
      name: title,  
      description: description,
      owner: {
        owner: ownerId.toString(),
        character: character
      },
      genre: genre || undefined  
    };

    const aiResponse = await axios.post(`${process.env.FASTAPI_URL}/story/new`, fastApiRequestData);
    const generatedContent = aiResponse.data?.content;

    if (!generatedContent) {
      return res.status(500).json(new ApiError(500, 'AI service did not return story content.'));
    }

    // Save to MongoDB using Node.js (in 'test' database)
    const newStory = await Story.create({
      title,
      description,
      genre: genre || undefined,  
      ownerid: [{ owner: ownerId, character: character }],
      content: [{
        prompt: `Starting scene for ${title}`,
        user: ownerId,
        response: generatedContent
      }],
      complete: false,
      public: false
    });

    // 3. Return the saved story
    res.status(201).json(new ApiResponse(true, {
      _id: newStory._id,
      title: newStory.title,
      description: newStory.description,
      genre: newStory.genre,
      character: character,
      content: newStory.content,
      complete: newStory.complete,
      createdAt: newStory.createdAt
    }, 'Story created and saved successfully'));

  } catch (error) {
    console.error("Error creating story:", error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.detail || 'Failed to create story via AI service.';
    return res.status(statusCode).json(new ApiError(statusCode, message));
  }
});

const getAllStories = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    return res.status(401).json(new ApiError(false, 'Unauthorized: User not authenticated'));
  }

  const stories = await Story.find({ "ownerid.owner": owner })
    .select('-ownerid')
    .sort({ createdAt: -1 });

  // Attach character to each story
  const result = stories.map((story) => {
    const ownerEntry = story.ownerid?.find((entry) =>
      entry.owner.equals(owner)
    );
    
    return {
      _id: story._id,
      title: story.title,
      description: story.description,
      genre: story.genre,
      character: ownerEntry ? ownerEntry.character : null,
      complete: story.complete,
      createdAt: story.createdAt,
      contentCount: story.content?.length || 0
    };
  });

  res.status(200).json(new ApiResponse(true, result, 'Stories fetched successfully'));
});

const getcomplete = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    return res.status(403).json(new ApiError(403, 'Login is required to do this functionality'));
  }

  const stories = await Story.find({
    "ownerid.owner": owner,
    complete: true
  }).select("-prompt -response").sort({ updatedAt: -1 });

  const result = stories.map((story) => {
    const ownerEntry = story.ownerid.find((entry) =>
      entry.owner.equals(owner)
    );

    return {
      ...story.toObject(),
      character: ownerEntry ? ownerEntry.character : null,
    };
  });

  return res.status(200).json(new ApiResponse(200, result, 'Complete stories fetched successfully'));
});

const getincomplete = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    return res.status(403).json(new ApiError(403, 'Login is required to do this functionality'));
  }

  const stories = await Story.find({
    "ownerid.owner": owner,
    complete: false
  }).select('-prompt -response').sort({ updatedAt: -1 });

  const result = stories.map((story) => {
    const ownerEntry = story.ownerid.find((entry) =>
      entry.owner.equals(owner)
    );

    return {
      ...story.toObject(),
      character: ownerEntry ? ownerEntry.character : null,
    };
  });

  return res.status(200).json(new ApiResponse(200, result, 'Incomplete stories fetched successfully'));
});

const getpublicstories = asyncHandler(async (req, res) => {
  try {
  const stories = await Story.find({ public: true })
    .select('-ownerid')
    .sort({ createdAt: -1 });
  res.status(200).json(new ApiResponse(true, stories, 'Public stories fetched successfully'));
  } catch (error) {
    console.error("Error fetching public stories:", error);
    return res.status(500).json(new ApiError(500, 'Failed to fetch public stories.'));
  } 
});

const deleteStory = asyncHandler(async (req, res) => {
  const storyId = req.params.storyId?.trim();
  const ownerId = req.user?._id;

  if (!storyId) {
    return res.status(400).json(new ApiError(400, "Story ID is required"));
  }

  const story = await Story.findOne({
    _id: storyId,
    "ownerid.owner": ownerId
  });

  if (!story) {
    return res.status(404).json(new ApiError(404, "Story not found or you are not the owner"));
  }

  await story.deleteOne();
  return res.status(200).json(new ApiResponse(200, null, "Story deleted successfully"));
});

const getStoryContent = asyncHandler(async (req, res) => {
  const { story_id } = req.params;
  const trimmedStoryId = story_id?.trim();
  const owner = req.user?._id;

  if (!trimmedStoryId) {
    return res.status(400).json(new ApiError(400, 'Story id is required'));
  }

  const story = await Story.findOne({
    _id: trimmedStoryId,
    "ownerid.owner": owner
  }).select('-ownerid');

  if (!story) {
    return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
  }

  // Get character for this owner
  const ownerEntry = story.ownerid?.find((entry) =>
    entry.owner.equals(owner)
  );

  res.status(200).json(new ApiResponse(true, {
    _id: story._id,
    title: story.title,
    description: story.description,
    genre: story.genre,
    character: ownerEntry ? ownerEntry.character : null,
    content: story.content,
    complete: story.complete,
    public: story.public
  }, 'Story content fetched successfully'));
});

const addpromptResponse = asyncHandler(async (req, res) => {
  console.log("addpromptResponse called");
  const { story_id } = req.params;
  const trimmedStoryId = story_id?.trim();
  const { prompt } = req.body;
  const userId = req.user?._id;

  if (!prompt) {
    return res.status(400).json(new ApiError(400, 'Prompt is required'));
  }

  try {
    // Call FastAPI to continue the story (FastAPI will update MongoDB)
    const fastApiRequestData = {
      story_id: trimmedStoryId,
      user_id: userId.toString(),
      user_action: prompt
    };

    const response = await axios.post(
      `${process.env.FASTAPI_URL}/story/continue`,
      fastApiRequestData
    );

    // Fetch updated story from MongoDB
    const updatedStory = await Story.findById(trimmedStoryId).select('-ownerid');
    
    if (!updatedStory) {
      return res.status(404).json(new ApiError(404, 'Story not found after update'));
    }
    console.log("Story continued successfully");
    console.log(updatedStory.content);
    res.status(200).json(new ApiResponse(true, {
    content: updatedStory.content,
    }, 'Story continued successfully'));

  } catch (error) {
    console.error("Error calling FastAPI to continue story:", error.response?.data || error.message);
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.detail || 'Failed to continue story via AI service.';
    return res.status(statusCode).json(new ApiError(statusCode, message));
  }
});

const toggleCompleteStatus = asyncHandler(async (req, res) => {
  const { story_id } = req.params;
  const owner = req.user?._id;

  if (!story_id) {
    return res.status(400).json(new ApiError(400, 'Story id is required'));
  }

  const story = await Story.findOne({
    _id: story_id,
    "ownerid.owner": owner
  });

  if (!story) {
    return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
  }

  story.complete = !story.complete;
  await story.save();

  res.status(200).json(new ApiResponse(true, {
    _id: story._id,
    complete: story.complete
  }, `Story marked as ${story.complete ? 'complete' : 'incomplete'}`));
});

export {
  createStory,
  getAllStories,
  getcomplete,
  getincomplete,
  deleteStory,
  addpromptResponse,
  toggleCompleteStatus,
  getStoryContent
};
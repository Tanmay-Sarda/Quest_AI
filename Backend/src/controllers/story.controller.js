import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHandler.js';
import { Story } from '../models/Story.models.js';
import axios from "axios";
import mongoose from 'mongoose';


const createStory = asyncHandler(async (req, res) => {
  // Get data from the user's request
  const { title, description, character } = req.body;
  const ownerId = req.user?._id;

  if (!ownerId) {
    return res.status(401).json(new ApiError(401, 'Unauthorized: User not authenticated'));
  }

  if (!title || !description || !character) {
    return res.status(400).json(new ApiError(400, 'Title, description, and character name are required'));
  }


  try {
    const fastApiRequestData = {
      name: title,
      description: description,
      owner: {
        owner: ownerId.toString(),
        character: character
      }
    };

    // Call your FastAPI service to generate the story
    const aiResponse = await axios.post(`${process.env.FASTAPI_URL}/story/new`, fastApiRequestData);

    //2. Extract the generated content from the AI response
    const generatedContent = aiResponse.data?.content;

    if (!generatedContent) {
      // Handle cases where the AI service didn't return content
      return res.status(500).json(new ApiError(500, 'AI service did not return story content.'));
    }

    //3. Create and save the new story to your MongoDB database
    const newStory = await Story.create({
      title,
      description,
      character,
      ownerid: [{ owner: ownerId, character: character }],
      content: generatedContent,
    });

    //4. Send the story that was saved in *your* database back to the user
    res.status(201).json(new ApiResponse(true, newStory, 'Story created and saved successfully'));

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

  const story = await Story.find({ "ownerid.owner": owner }).select('-ownerid -prompt -response ');
  res.status(200).json(new ApiResponse(true, story, 'Stories fetched successfully'));
})

const getcomplete = asyncHandler(async (req, res) => {

  const owner = req.user?._id;
  if (!owner) {
    return res.status(403).json(new ApiError(403, 'Login is require to do this functionality'));
  }

  const story = await Story.find({
    $and: [
      { "ownerid.owner": owner },
      { compelete: true }
    ]
  }).select('-ownerid -prompt -response -compelete');

  return res.status(200).json(new ApiResponse(200, story, 'Complete story fetch succesflly'))
})

const getincomplete = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  if (!owner) {
    return res.status(403).json(new ApiError(403, 'Login is require to do this functionality'));
  }

  const story = await Story.find({
    $and: [
      { "ownerid.owner": owner },
      { compelete: false }
    ]
  }).select('-ownerid -prompt -response -compelete');

  return res.status(200).json(new ApiResponse(200, story, 'Incomplete story fetch succesflly'))

})
// ---deleting a story ----
const deleteStory = asyncHandler(async (req, res) => {
  const storyId = req.params.storyId?.trim();
  const ownerId = req.user?._id;
  console.log("Received storyId:", storyId, "ownerId:", ownerId);

  if (!storyId) {
    return res.status(400).json(new ApiError(400, "Story ID is required"));
  }

  console.log("storyId:", storyId, "ownerId:", ownerId);

  // Find the story and check ownership
  const story = await Story.findOne({
    _id: storyId,            // Mongoose can handle string IDs
    "ownerid.owner": ownerId // Check ownership
  });

  console.log("Found story:", story);


  if (!story) {
    return res.status(404).json(new ApiError(404, "Story not found or you are not the owner"));
  }

  await story.deleteOne();
  return res.status(200).json(new ApiResponse(true, null, "Story deleted successfully"));
});

const getStoryContent = asyncHandler(async (req, res) => {
  const { story_id } = req.params;
  const trimmedStoryId = story_id?.trim();
  const owner = req.user?._id;

  if (!trimmedStoryId) {
    return res.status(400).json(new ApiError(400, 'Story id is required'));
  }

  const story = await Story.findOne({ $and: [{ _id: trimmedStoryId }, { "ownerid.owner": owner }] }).select('-ownerid -title -description -compelete -public');

  if (!story) {
    return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
  }

  res.status(200).json(new ApiResponse(true, story, 'Story content fetched successfully'));
});
const addpromptResponse = asyncHandler(async (req, res) => {
  console.log("addpromptResponse called");
  // 1. Get data from the user's request
  const { story_id} = req.params;
  const trimmedStoryId = story_id?.trim();                      // problem ---
  const { prompt } = req.body; // The user's action/prompt
  const userId = req.user?._id; // From verifyJWT middleware

  if (!prompt) {
    return res.status(400).json(new ApiError(400, 'Prompt is required'));
  }

  try {
    // 2. Prepare the request body for the FastAPI /story/continue endpoint
    const fastApiRequestData = {
      story_id: trimmedStoryId,
      user_id: userId.toString(),
      user_action: prompt
    };

    // 3. Make the API call to your FastAPI service
    const response = await axios.post(`${process.env.FASTAPI_URL}/story/continue`, fastApiRequestData);

    // 4. Send the updated story from FastAPI back to the user
    res.status(200).json(new ApiResponse(true, response.data, 'Story continued successfully'));

  } catch (error) {
    // Handle potential errors (e.g., story not found in FastAPI)
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

  const story = await Story.findOne({ $and: [{ _id: story_id }, { "ownerid.owner": owner }] });
  if (!story) {
    return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
  }

  story.compelete = !story.compelete;
  await story.save();
  res.status(200).json(new ApiResponse(true, story, `Story marked as ${story.compelete ? 'complete' : 'incomplete'}`));
});


export { createStory, getAllStories, getcomplete, getincomplete, deleteStory, addpromptResponse, toggleCompleteStatus ,getStoryContent};



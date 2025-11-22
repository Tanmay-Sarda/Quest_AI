import axios from 'axios';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHandler.js';
import { Story } from '../models/Story.models.js';
import mongoose from 'mongoose';


const createStory = async (req, res) => {
  console.log("createStory called");
  const { title, description, character, genre, apiKey } = req.body;
  const ownerId = req.user?._id;
  const user = await mongoose.model('User').findById(ownerId);
  if (!user || !user.apiKey) {
    return res.status(403).json(new ApiError(403, 'API key is required to create a story.'));
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
      genre: genre || undefined,
      api_key: user.apiKey
    };

    const aiResponse = await axios.post(`${process.env.FASTAPI_URL}/story/new`, fastApiRequestData);
    const generatedContent = aiResponse.data?.content;
    const dialect = aiResponse.data?.dialect;

    if (!generatedContent) {
      return res.status(500).json(new ApiError(500, 'AI service did not return story content.'));
    }

    // Save to MongoDB using Node.js (in 'test' database)
    const newStory = await Story.create({
      title,
      description,
      genre: genre || undefined,
      dialect: dialect,
      ownerid: [{ owner: ownerId, character: character }],
      content: [{
        prompt: `Starting scene for ${title}`,
        user: ownerId,
        response: generatedContent
      }],
      complete: false,
      public: false
    });

    // Return the saved story
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
};

const getAllStories = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json(new ApiError(500, 'Failed to fetch stories'));
  }
};

const getcomplete = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch stories"))
  }
};

const getincomplete = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch stories"))
  }
};

const getpublicstories = async (req, res) => {
  try {
    const stories = await Story.find({
      public: true
    }).select('-prompt -response').populate('ownerid.owner', 'email').sort({ createdAt: -1 });

    const result = stories.map((story) => {
      const ownerEntry = story.ownerid[0]; // Get the first owner entry
      return {
        ...story.toObject(),
        character: ownerEntry ? ownerEntry.character : null,
        email: ownerEntry ? ownerEntry.owner.email : null,
      };
    });

    //remove ownerid from result
    result.forEach(story => {
      delete story.ownerid;
    });


    return res.status(200).json(new ApiResponse(200, result, 'Public stories fetched successfully'));
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to fetch stories"))
  }
};

const deleteStory = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Failed to delete story"))
  }
};

const getStoryContent = async (req, res) => {
  try {
    const { story_id } = req.params;
    const trimmedStoryId = story_id?.trim();

    if (!trimmedStoryId) {
      return res.status(400).json(new ApiError(400, 'Story id is required'));
    }

    const story = await Story.findOne({
      _id: trimmedStoryId,
    }).select('-ownerid');

    if (!story) {
      return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
    }


    res.status(200).json(new ApiResponse(true, {
      _id: story._id,
      title: story.title,
      description: story.description,
      genre: story.genre,
      content: story.content,
      complete: story.complete,
      public: story.public
    }, 'Story content fetched successfully'));
  } catch (err) {
    return res.status(500).json(new ApiError(500, "Failed to fetch story content"))
  }
};

const addpromptResponse = async (req, res) => {
  console.log("addpromptResponse called");
  const { story_id } = req.params;
  const trimmedStoryId = story_id?.trim();
  const { prompt } = req.body;
  const userId = req.user?._id;
  const user = await mongoose.model('User').findById(userId);
  if (!user || !user.apiKey) {
    return res.status(403).json(new ApiError(403, 'API key is required to continue a story.'));
  }

  if (!prompt) {
    return res.status(400).json(new ApiError(400, 'Prompt is required'));
  }

  try {
    // Call FastAPI to continue the story (FastAPI will update MongoDB)
    const fastApiRequestData = {
      story_id: trimmedStoryId,
      user_id: userId.toString(),
      user_action: prompt,
      api_key: user.apiKey
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
    if (updatedStory.public) {
      updatedStory.public = false;
      await updatedStory.save();
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
};

const toggleCompleteStatus = async (req, res) => {
  try{
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
}catch(error){
  return res.status(500).json(new ApiError(500, "Failed to toggle story status"))
}
};

const changeAccess = async (req, res) => {
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

  //Check the owner always the first entry
  if (!story.ownerid[0].owner.equals(owner)) {
    return res.status(403).json(new ApiError(403, 'Only the main owner can change access'));
  }

  story.public = !story.public;
  await story.save();

  res.status(200).json(new ApiResponse(true, {
    _id: story._id,
    public: story.public
  }, `Story access changed to ${story.public ? 'public' : 'private'}`));
};

export {
  createStory,
  getAllStories,
  getcomplete,
  getincomplete,
  deleteStory,
  addpromptResponse,
  toggleCompleteStatus,
  getStoryContent,
  getpublicstories,
  changeAccess
};
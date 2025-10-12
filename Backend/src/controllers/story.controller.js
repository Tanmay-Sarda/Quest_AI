import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/AsyncHandler.js';
import { Story } from '../models/Story.models.js';


const createStory = asyncHandler(async (req, res) => {
  // Logic to create a new story
  const { title, description, character } = req.body;
  const owner = req.user?._id;

  if (!owner) {
    return res.status(401).json(new ApiError(401, 'Unauthorized: User not authenticated'));
  }

  if (!title || !description) {
    return res.status(400).json(new ApiError(false, 'Title and description are required'));
  }

  const newStory = new Story({
    title,
    description,
    ownerid: [{ owner: owner, character: character }],
    content: [],
    compelete: false,
    public: false
  });
  await newStory.save();
  res.status(201).json(new ApiResponse(true, newStory, 'Story created successfully'));
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


const addpromptResponse = asyncHandler(async (req, res) => {

   
  const {story_id}=req.params;
   const {owner} = req.user?._id;

    if(!story_id){
    return res.status(400).json(new ApiError(400, 'Story id is required'));
  }
   

   const Check= await Story.findOne({ $and: [ { _id: story_id }, { "ownerid.owner": owner } ] });
   if(!Check){
    return res.status(404).json(new ApiError(404, 'Story not found or you are not the owner'));
   }

    const { prompt,response } = req.body;
    if (!prompt) {
      return res.status(400).json(new ApiError(400, 'Prompt is required'));
    }

    if (!response) {
      return res.status(400).json(new ApiError(400, 'Response is required'));
    }

    Check.content.push({ prompt, user: owner, response });
    await Check.save();
    res.status(200).json(new ApiResponse(true, Check, 'Content added successfully'));

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


export { createStory, getAllStories,getcomplete,getincomplete, addpromptResponse, toggleCompleteStatus };



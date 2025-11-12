import { createStory, getAllStories,getcomplete,getincomplete,deleteStory, addpromptResponse,toggleCompleteStatus,getStoryContent,getpublicstories,changeAccess} from '../controllers/story.controller.js';
import express, { Router } from 'express';
const router = Router();
import { verifyJWT } from '../middleware/auth.middleware.js';

router.get('/publicstories', getpublicstories);
router.get('/content/:story_id', getStoryContent);

// All routes are protected
router.use(verifyJWT);
router.post('/create', createStory);
router.get('/all', getAllStories);
router.get('/complete', getcomplete);
router.get('/incomplete', getincomplete);
router.delete("/:storyId",deleteStory);
router.post('/addcontent/:story_id', addpromptResponse);
router.post('/toggle-complete/:story_id', toggleCompleteStatus);
router.post('/changeaccess/:story_id', changeAccess);
export default router;
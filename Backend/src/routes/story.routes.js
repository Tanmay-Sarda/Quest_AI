import { createStory, getAllStories,getcomplete,getincomplete, addpromptResponse,toggleCompleteStatus } from '../controllers/story.controller.js';
import express, { Router } from 'express';
const router=Router();
import {verifyJWT} from '../middleware/auth.middleware.js';

//All routes are protected
router.use(verifyJWT);
router.post('/create', createStory);
router.get('/all', getAllStories);
router.get('/complete', getcomplete);
router.get('/incomplete', getincomplete);
router.post('/addcontent/:story_id', addpromptResponse);
router.post('/toggle-complete/:story_id', toggleCompleteStatus);
export default router;
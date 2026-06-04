import express from 'express';
import { getNotes , getNote , createNote , updateNote , deleteNote , deleteFile , generateToken , shareNote , getInstantPreview} from '../Controllers/notesController.js';
import {protect} from '../Middlewares/authMiddleware.js';
import upload from '../Middlewares/uploadMiddleware.js';



const router = express.Router();

router.get('/' , protect ,getNotes);
router.get('/:id', protect  , getNote);


router.post('/',protect , upload.array('files' , 10), createNote);


router.put('/:id' , protect , upload.array('files' , 10), updateNote);



router.delete('/:id' , protect , deleteNote);
router.delete('/:noteId/files/:fileId' , protect , deleteFile);


router.put('/:id/share' , protect , generateToken );
router.get('/shared/:token' , shareNote);

router.get('/preview' , protect , getInstantPreview)


export default router;



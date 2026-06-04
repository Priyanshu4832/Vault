import asyncHandler from 'express-async-handler';
import prisma from '../../config/client.js';
import { Readable } from 'stream';
import crypto from 'crypto';
import { getLinkPreview } from 'link-preview-js'; 



// this is upload to cloudsteam util function
// returns a promise that resolves with the uploaded file's details (url, public_id, name, type)
const uploadToCloudinary = async (fileBuffer, originalName, mimeType) => {
    
    return new Promise((resolve, reject) => {
        
        // convert buffer to readable stream
        const stream = Readable.from(fileBuffer);

        // create a cloudinary upload stream
        // resource_type: 'auto' means cloudinary figures out if it's image, pdf, video etc
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if(error) reject(error);
                else resolve({
                    fileUrl           : result.secure_url,  // https link to the file
                    cloudinaryPublicId: result.public_id,   // needed later for deletion
                    fileName          : originalName,        // e.g. "resume.pdf"
                    fileType          : mimeType             // e.g. "application/pdf"
                });
            }
        );

        // pipe the readable stream into cloudinary
        stream.pipe(uploadStream);
    });
};





//@desc      ALL notes
//@routes    GET /api/notes?search=keyword
//access     Private
export const getNotes = asyncHandler(async (req,res)=>{

    const { search } = req.query;


    const notes = await prisma.note.findMany({
        where :{
            userId : req.user.id,
            ...(search && {
                content: { contains: search, mode: 'insensitive'}
            })
        },
        include :{files : true},
        orderBy : {updatedAt : 'desc'}
    })

    res.status(200).json({
        "message" : "Notes fetched successfully",
        "count" : notes.length,
        "notes" : notes
    })


    
})

//@desc      ALL notes
//@routes    GET /api/notes/:id
//access     Private
export const getNote = asyncHandler(async (req ,res)=>{

    const noteId =  Number(req.params.id);

    const note = await prisma.note.findFirst({
        where :{
            id : noteId,
            userId : req.user.id,
            
        }
    })

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }
    res.status(200).json({
        "message" : "Note fetched successfully",
        "note" : note
    })
})


//@desc      create note
//@routes    POST: /api/notes
//access     Private
export const createNote = asyncHandler(async (req, res) => {
    const { content } = req.body;

    //check if content exists
    if(!content){
        res.status(400);
        throw new Error("Content is required");
    }

    
    // if req.file exists, upload to cloudinary and save to File table

    let uploadedFiles = [];
 
    if(req.files && req.files.length >0){
        for(const file of req.files){
            const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
            uploadedFiles.push(result);
        }
    }
    

    
    // create the note in database with userId from req.user.id
    const note = await prisma.note.create({
        data:{
            userId : req.user.id,
            content : content,
            ...(uploadedFiles.length>0 && {
                files : {
                    create: uploadedFiles
                }
            }),

        },
        include : {files : true}
    })

    // send back the created note
    res.status(201).json({
        "message" : "Note created successfully",
        "note" : note
    })
})



//@desc      update note content and add files
//@routes    PUT: /api/notes/:id
//access     Private
export const updateNote = asyncHandler( async (req , res)=>{

    const {content} = req.body;
     
    const noteId = Number(req.params.id);


    const note = await prisma.note.findFirst({
        where : {
            id : noteId,
            userId : req.user.id,
        },
    })

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }


    let uploadedFiles = [];
    if(req.files && req.files.length >0){
        for(const file of req.files){
            const result = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
            uploadedFiles.push(result);
        }
    }

    // update the note content and add new files to the note
    const updatedNote = await prisma.note.update({
        where : {
            id : noteId
        },
        data : {
            content : content,
            ...(uploadedFiles.length>0 && {
                files : {
                    create : uploadedFiles
                }
            })
        },
        include : {files : true}
    })

    res.status(200).json({
        "message" : "Note updated successfully",
        "note" : updatedNote
    })

    
})


//@desc      delete note content and all the files
//@routes    DELETE: /api/notes/:id
//access     Private

export const deleteNote = asyncHandler( async (req, res)=>{

    const noteId = Number(req.params.id);
    
    const note = await prisma.note.findFirst({
        where : {
            id : noteId,
            userId : req.user.id,
        },
        include: { files: true } 
    })

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }

    let deletedFiles = [];
    if(note.files && note.files.length >0){
        for(const file of note.files){
            await cloudinary.uploader.destroy(file.cloudinaryPublicId);
            deletedFiles.push(file.fileName);
        }
    }

    await prisma.note.delete({
        where : {
            id : noteId
        }
    })

    res.status(200).json({
        "message" : "Note and associated files deleted successfully",
        "deletedFiles" : deletedFiles,
        "deletedNoteId" : noteId
    })
})




//@desc      delete single file 
//@routes    DELETE: /api/notes/:noteId/files/:fileId
//access     Private

export const deleteFile = asyncHandler( async (req, res)=>{

    const noteId = Number(req.params.noteId);
    const fileId = Number(req.params.fileId);


    const note = await prisma.note.findFirst({
        where : {
            id : noteId,
            userId : req.user.id,
        }
    })

    if(!note){
        res.status(404);
        throw new Error("Note not found");
    }


    const file = await prisma.file.findFirst({
        where : {
            id : fileId,
            noteId : noteId
        }
    })
    if(!file){
        res.status(404);
        throw new Error("File not found");
    }

    await cloudinary.uploader.destroy(file.cloudinaryPublicId);

    await prisma.file.delete({
        where : {
            id : fileId
        }
    })
    res.status(200).json({
        "message" : "File deleted successfully",
        "deletedFileName" : file.fileName,
        "deletedFileId" : fileId
    })
    

});




//@desc      generate a token  
//@routes    PUT: /api/notes/:id/share
//access     Private
export const generateToken = asyncHandler (async (req , res)=>{

    const noteId = Number(req.params.id);

    // check for note
    const note = await prisma.note.findFirst({
        where :{
            id : noteId,
            userId : req.user.id
        }
        
    })

    if(!note){
        res.status(404);
        throw new Error("Note not Found!");
    }

    const token = note.shareToken;
    if(!token){
        
        token = crypto.randomUUID(); //something like 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6'
        
        // Save the new token to the database
        await prisma.note.update({
            where:{ id : noteId},
            data : { shareToken : token}
        });
        
    }

    

    res.status(200).json({
        "message":"token generated successfully!",
        "token" : token
    })
})




//@desc      get the note with the token
//@routes    GET:  /api/notes/shared/:token
//access     Private
export const shareNote = asyncHandler (async(req , res)=>{

    const token = req.params.token;

    const note = await prisma.note.findUnique({
        where : {
            shareToken : token
        },
        include : { files : true}
    })

    if(!note){
        res.status(404);
        throw new Error("Note not found!");
    }
    res.status(200).json({
        success: true,
        note: {
            title: note.title,
            content: note.content,
            files: note.files,
            updatedAt: note.updatedAt
        }
    });
})





//@desc      Get live link metadata preview 
//@routes    POST /api/notes/preview
//access     Private
export const getInstantPreview = asyncHandler(async (req, res) => {
    const { url } = req.body;

    if (!url) {
        res.status(400);
        throw new Error("URL is required");
    }

    try {
        // 3-second timeout guard
        const data = await getLinkPreview(url, { timeout: 3000 });

        res.status(200).json({
            success: true,
            preview: {
                title: data.title || "Shared Link",
                // Grab the first image 
                image: data.images && data.images.length > 0 ? data.images[0] : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
                description: data.description || ""
            }
        });
    } catch (error) {
     
        res.status(200).json({
            success: false,
            preview: {
                title: "Link Preview Unavailable",
                image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
                description: "Preview details could not be loaded for this website."
            }
        });
    }
});
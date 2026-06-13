import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import prisma from '../../config/client.js';

export const protect = asyncHandler(async(req, res , next)=>{
    // get header token (bearer token)
    const authHeader = req.headers.authorization;
    console.log('Auth header received:', authHeader);

    // get the exact token from header and verify it

    let token;
    if(authHeader && authHeader.startsWith('Bearer')){
        token = authHeader.split(' ')[1];
        

        try{
            //decode the token

            const decode = jwt.verify(token , process.env.JWT_SECRET);
            // decode will give us the payload we used to sign the token which is user id
         
            
            const user = await prisma.user.findUnique({where : {id : decode.id}});
            if(!user){
                res.status(401);
                throw new Error("User does not exist");
            }
            req.user = user;
            next();

        }
        catch(error){
            res.status(401);
            throw new Error("Not authorized, token failed or expired");
        }

        
        
    }
    if(!token){
        res.status(401);
        throw new Error("Not authorized, no token");
    }

});



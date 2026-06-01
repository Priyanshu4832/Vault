import express from 'express';
import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/client.js';




//@desc  Register user
//@route POST: /api/auth/register
//@access
export const registerUser = asyncHandler(async(req , res)=>{


    const {name , email , password} = req.body;

    if(!name ||!email || !password){
        throw new Error('Please fill all the fields');
    }
    
    // Check if user already exists
    const userExsists = await prisma.user.findUnique({where : { email : email}});
    if(userExsists){
        throw new Error('User already exists');
    }

    
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password , salt);



    const user = await prisma.user.create({
        data : {
            "name" : name,
            "email" : email,
            "password" : hashedPassword
        }
        
    })



    const token = jwt.sign(
        { "id" : user.id},
        process.env.JWT_SECRET,
        {expiresIn : '7d'}
    );

    res.status(201).json({
        "message" : "User registered successfully",
        "token" : token
    })


});

//@desc Login user
//@route POST: /api/auth/login
//@access private

export const loginUser = asyncHandler (async(req,res)=>{

    // get email id and passowrd , check if user exisits or not then 
    //  compare password with user hashed password then generate token and send response

    const {email, password} = req.body;

    if(!email || !password){
        res.status(400); // bad request
        throw new Error('Either email or password is missing');
    }

    const userExsists = await prisma.user.findUnique({where : {email}});
    if(!userExsists){
        res.status(400);
        throw new Error('Invalid credentials');
    }

    // compare password
    const isPasswordMatch = await bcrypt.compare(password , userExsists.password);
    if(!isPasswordMatch){
        res.status(400);
        throw new Error('Invalid credentials');
    }

    // return a token
    const token = jwt.sign(
        {"id" : userExsists.id},
        process.env.JWT_SECRET,
        {expiresIn : '7d'}
    );

    res.status(200).json({
        "message":"login successful",
        "token" : token
    })

})


//@desc get user data
//@route GET: /api/auth/getMe
//@access private

export const getMe = asyncHandler(async(req , res)=>{
    // get user id from token and verify if it corresponds to a user in the database then return user data
    // but verifying step is dont by middleware so here we just need to return user data

    res.status(200).json({
        "message" : "User data fetched successfully",
        "user" : req.user
    })
});


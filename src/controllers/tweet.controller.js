import mongoose ,{isValidObjectId }from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Tweet } from "../models/tweet.model.js";


const createTweet = asyncHandler(async(req,res)=>{
    const {content}= req.body;

    if (!content){
        throw new ApiError(400,"content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner : req.user?._id
})
if (!tweet){
    throw new ApiError(500,"failed to create Tweet please try again");
}

return res
.status(200)
.json(new ApiResponse(200, tweet, "Tweet created successfully"));
})

const updateTweet= asyncHandler(async(req,res)=>{
    const {content}=req.body;
    const {tweetId}=req.params;

    if (!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweetId is not valid");
    }

    if (!content){
        throw new ApiError(400,"content is required");
    }

    const tweet= await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(404,"only owner can edit the tweet");
    }

    const updatedTweet= await Tweet.findByIdAndUpdate(
        tweet?._id,
        {
            $set:{
                content
            }
        },
        {
           new: true 
        }
       
)
if (!updatedTweet){
    throw new ApiError(500,"failed to update Tweet please try again");
}

return res
.status(200)
.json(new ApiResponse(200, updatedTweet, "Tweet updated successfully"));
})

const deleteTweet= asyncHandler(async(req,res)=>{
    
    const {tweetId}=req.params;

    if (!isValidObjectId(tweetId)){
        throw new ApiError(400,"tweetId is not valid");
    }

    const tweet= await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(404,"only owner can delete the tweet");
    }

    const deletedTweet= await Tweet.findByIdAndDelete(tweet?._id)

if (!deletedTweet){
    throw new ApiError(500,"failed to delete Tweet please try again");
}

return res
.status(200)
.json(new ApiResponse(200, {}, "Tweet deleted successfully"));
})


const getUserTweets = asyncHandler(async (req,res)=>{

    const {userId}=req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400,"userId is not valid");
    }

    const tweets= await Tweet.aggregate([
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                 }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"tweet",
                    as:"likes",
                 }
            },
            {
                $addFields:{
                    likesCount:{
                        $size:"$likes"
                    },
                    owner:{
                        $first:"$owner"
                    },
                   isLiked: {
                       $cond:{
                        if:{$in:[req.user?._id,"$likes.likedBy"]},
                        then:true,
                        else:false
                       }
                    }
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $project:{
                    content:1,
                    "owner.username":1,
                    "owner.email":1,
                    "owner.avatar":1,
                    "owner.fullName":1,
                    likesCount:1,
                    isLiked:1,
                    createdAt:1,
                    updatedAt:1
                }
            }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
})


export { createTweet, updateTweet, deleteTweet, getUserTweets };
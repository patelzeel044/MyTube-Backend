import mongoose ,{isValidObjectId }from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req,res)=>{
const {videoId}=req.params
const {page=1 ,limit=10}=req.query

if(!isValidObjectId(videoId)){
    throw new ApiError(400, "invalid videoId")
}

const video =await Video.findById(videoId)

if(!video){
    throw new ApiError(400, "video not found")
}

const commentsAggregate= Comment.aggregate([
    {
        $match:{
            video: new mongoose.Types.ObjectId(videoId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner"
        },
    },
    {
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"comment",
            as:"likes"
        },
    },
    {
        $addFields:{
            likesCount:{
                $size: "$likes"
            },
            owner:{
                $first: "$owner"
            },
            isLiked:{
                $cond:{
                    if:{$in:[req.user._id,"$likes.likedBy"]},
                    then:true,
                    else:false
                }
            }
        }
    },
    {
        $project:{
            content:1,
            createdAt:1,
            likesCount:1,
            owner:{
                username:1,
                fullName:1, 
                avatar:1
            }, 
            isLiked:1
        }
    }
])


const options={
    page:parseInt(page,10),
    limit:parseInt(limit,10),

}

const comments= await Comment.aggregatePaginate(
    commentsAggregate,
    options
);

return res
    .status(200)
    .json(new ApiResponse(200,comments,"Comments Fetched Successfully"));

})


const addComment = asyncHandler(async (req,res)=>{
   
    const {videoId} = req.params;

    const {content} = req.body;

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "invalid videoId")
    }

    
    if(!content || content.trim()=== ""){
            throw new ApiError(400, "content is required")   
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    if(!comment){
        throw new ApiError(500, "failed to add comment please try try again")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comment,"comment added successfully"))

    });




const updateComment = asyncHandler(async (req,res)=>{
   const {commentId} =req.params
   const {content}= req.body;

  
   if(!isValidObjectId(commentId)){
    throw new ApiError(400, "invalid commentId")
}


if(!content || content.trim()=== ""){
        throw new ApiError(400, "content is required")   
}

const comment = await Comment.findById(commentId);

if (!comment) {
    throw new ApiError(404, "Comment not found");
}

if(comment?.owner.toString() !== req.user?._id.toString()){
    throw new ApiError(400, "only comment owner can edit their comment")
};

const updatedComment= await Comment.findByIdAndUpdate(
    comment?._id ,
    {
        $set:{
            content
        }
    },
        { new:true }
    )

    if (!updatedComment) {
        throw new ApiError(500, "failed to update comment");
    }


    return res
    .status(200)
    .json(new ApiResponse(200,updatedComment,"comment updated successfully"))

    })


const deleteComment = asyncHandler(async (req,res)=>{
   const { commentId} = req.params

   const comment = await Comment.findById(commentId);

   if (!comment) {
       throw new ApiError(404, "Comment not found");
   }
   
   if(comment?.owner.toString() !== req.user?._id.toString()){
       throw new ApiError(400, "only comment owner can delete their comment")
   };
   
   const deletedComment= await Comment.findByIdAndDelete(
       comment?._id
       )
   
       if (!deletedComment) {
           throw new ApiError(500, "failed to delete comment");
       }
   
   
       return res
       .status(200)
       .json(new ApiResponse(200,{},"comment deleted successfully"))
   
       })
   


export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
import mongoose ,{ isValidObjectId }from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";

const publishAVideo = asyncHandler(async (req,res)=>{

    const {title, description}= await req.body;

    if([title,description].some(field=>field?.trim()==="")){
        throw new ApiError(400, "title and description both are required")
    }

    const VideoFileLocalPath = req.files?.videoFile[0].path
    const thumbnailLocalPath = req.files?.thumbnail[0].path

    if(!VideoFileLocalPath){
        throw new ApiError(400, "VideoFileLocalPath is required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnailLocalPath is required")
    }

   const videoFile = await uploadOnCloudinary(VideoFileLocalPath)
   const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

   if(!videoFile){
    throw new ApiError(500, "videofile not uploaded on cloudinary due to server error")
}

if(!thumbnail){
    throw new ApiError(500, "thumbnail not uploaded on cloudinary due to server error")
}

        const video = await Video.create({
            title,
            description,
            duration:videoFile.duration, 
            videoFile:videoFile.url,
            thumbnail:thumbnail.url,
            owner: req.user?._id,
            isPublished:false
        })


        const videoUploaded = await Video.findById(video._id)

        if(!videoUploaded){
            throw new ApiError(500, "video upload failed please try again")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"));
})
 

const getVideoById = asyncHandler(async (req,res)=>{

    const{videoId} = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId");
    }

    
    if (!isValidObjectId(req.user?._id)) {
        throw new ApiError(400, "Invalid userId");
    }

    const video = await Video.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                pipeline:[
                    {
                        $lookup:{
                             from:"subscriptions",
                             localField:"_id",
                             foreignField:"channel",
                             as:"subscribers",
                        },
                       
                    },
                    {
                        $addFields:{
                            subscribersCount:{
                                $size:"$subscribers"
                            },
                            isSubscribed:{
                                $cond:{
                                    if:{$in:[req.user?._id, "$subscribers.subscriber"]},
                                    then: true,
                                    else: false
                                },
                             
                            }
                        }
                    },
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1,
                            subscribersCount:1,
                            isSubscribed:1
                        }
                    }
                ]

            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes",
                },
                owner:{
                    $first:"$owner"
                },
                isLiked:{
                    $cond: {
                        if: {$in: [req.user?._id, "$likes.likedBy"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                title:1,
                description:1,
                views:1,
                duration:1,
                owner:1,
                likesCount:1,
                isLiked:1,
                createdAt:1,
                comments: 1,
            }
        }
    ])

    if (!video) {
        throw new ApiError(500, "failed to fetch video");
    }

    await Video.findByIdAndUpdate(videoId,{
        $inc:{
            views:1
        }
    })

    await User.findByIdAndUpdate(req.user?._id,{
        
        $addToSet:{
                    watchHistory:videoId
                  }
    })


    return res
        .status(200)
        .json(
            new ApiResponse(200, video[0], "video details fetched successfully")
        );
}) 


const updateVideo = asyncHandler(async (req, res) => {

    const {title,description}= req.body

    const {videoId} = req.params


    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    if (!(title && description)) {
        throw new ApiError(400, "title and description are required");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't edit this video as you are not the owner"
        );
    }


    const thumbnailToDelete = video.thumbnail;

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400, "thumbnail is required");
    }

    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail) {
        throw new ApiError(400, "thumbnail not found");
    }


    const updatedVideo = await Video.findByIdAndUpdate(videoId,
        {
       $set:{
        title,
        description,
        thumbnail:thumbnail.url
       },
       
    },
    {
        new:true
    }

)

if (!updatedVideo) {
    throw new ApiError(500, "Failed to update video please try again");
}

if (updatedVideo) {
   await deleteOnCloudinary(thumbnailToDelete);

}


return res
.status(200)
.json(new ApiResponse(200, updatedVideo, "video updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {

    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't delete this video as you are not the owner"
        );
    }


    const videoDeleted= await Video.findByIdAndDelete(videoId)

    if(!videoDeleted){
        throw new ApiError(400, "Failed to delete the video please try again")
    }

    await deleteOnCloudinary(video.thumbnail)
    await deleteOnCloudinary(video.videoFile, "video")


    await Like.deleteMany({
        video:videoId
    })

    await Comment.deleteMany({
        video:videoId
    })

    return res.
    status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"))

})


const togglePublishStatus = asyncHandler(async (req, res) => {
   
    const {videoId} = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "No video found");
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't toggle publish status as you are not the owner"
        );
    }

    const toggleVideo= await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:!video?.isPublished
            }
        },
        {
            new:true
        }
    )

if(!toggleVideo){
    throw new ApiError(500, "Failed to toggle video publish status");
}

return res
.status(200)
.json(
    new ApiResponse(
        200,
        { isPublished: toggleVideo.isPublished },
        "Video publish toggled successfully"
    )
);

})

const getAllVideos = asyncHandler(async(req,res)=>{
     
const{page=1, limit=10, query, sortBy, sortType, userId }= req.query;



const pipeline = []

if(query){
    pipeline.push({
        $search:{
            index:"search-videos",
            text:{
                query: query,
                path:["title", "description"]
            }
        }
    })
}

   if(userId){

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid userId")
    }


    pipeline.push({
        $match:{
            owner: new mongoose.Types.ObjectId(userId)
        }
    })

   }


   pipeline.push({
    $match:{
        isPublished: true
    }
   })

   if(sortBy && sortType){

    pipeline.push(
        {
          $sort:{
            [sortBy]: sortType === "asc" ? 1 : -1
          }
        }
    );

   } else {

    pipeline.push({
        $sort:{
            createdAt: -1
        }
    })

   }

    pipeline.push(
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$owner"
        }
    )


    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    }

    const video = await Video.aggregatePaginate(videoAggregate, options)

    return res
    .status(200)
    .json(new ApiResponse(200, video, "Videos fetched Successfully"))

})


export {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus,
};
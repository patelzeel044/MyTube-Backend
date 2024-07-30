import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"


const getChannelStats= asyncHandler (async (req,res)=>{

    const totalSubscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $group: {
                _id: null,
                subscribersCount: {
                    $sum: 1
                }
            }
        }
       
    ])

    const video= await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $project:{
                likesCount:{
                    $size:"$likes"
                },
                views:"$views",
                totalVideos:1
            }
        },
        {
            $group:{
                _id:null,
                totalLikes:{
                    $sum:"$likesCount"
                },
                totalViews:{
                    $sum:"$views"
                },
                totalVideos:{
                    $sum:1
                },

            }
        }
    ])

    const channelStats = {
        totalSubscribers: totalSubscribers[0]?.subscribersCount || 0,
        totalLikes: video[0]?.totalLikes || 0,
        totalViews: video[0]?.totalViews || 0,
        totalVideos: video[0]?.totalVideos || 0
    };

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channelStats,
            "channel stats fetched successfully"
        )
    );
})


const getChannelVideos = asyncHandler (async (req,res)=>{

    
    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $sort: {
                createdAt: -1
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
                likesCount:1,
                isPublished:1,
                createdAt:1,
                updatedAt:1
            }
        },
       
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            videos,
            "user videos fetched successfully"
        )
    );
    
})




export {
    getChannelStats, 
    getChannelVideos
    }
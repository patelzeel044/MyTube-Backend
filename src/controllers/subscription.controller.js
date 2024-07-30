import mongoose,{isValidObjectId }from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subscription.model.js";



const toggleSubscription = asyncHandler( async ( req , res )=>{

    const {channelId} =req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId");
    }

    const subscribedAlready = await Subscription.findOne({
        channel:channelId,
        subscriber: req.user?._id
    })


    const isSubscribed = subscribedAlready ? await Subscription.findByIdAndDelete(subscribedAlready._id) 
                                           : await Subscription.create({
                                                                 channel:channelId,
                                                                 subscriber:req.user?._id
                                                                 })
       return res
       .status(200)
       .json(new ApiResponse(
        200, 
        subscribedAlready ? {}  : isSubscribed , 
        subscribedAlready ? "UnSubscribed channel successfully" 
                          : "Subscribed channel successfully"
                         ))                             

})


const getSubscribedChannels = asyncHandler(async (req,res) => {

        const subscribedChannels = await Subscription.aggregate([
            {
                $match: {
                    subscriber: new mongoose.Types.ObjectId(req.user?._id),
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'channel',
                    foreignField: '_id',
                    as: 'channel',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'videos',
                                localField: '_id',
                                foreignField: 'owner',
                                as: 'videos',
                                pipeline: [
                                    {
                                        $match: {
                                            isPublished: true, 
                                        },
                                    },
                                    {
                                        $lookup: {
                                            from: 'users',
                                            localField: 'owner',
                                            foreignField: '_id',
                                            as: 'owner',
                                        },
                                    },
                                    {
                                        $addFields: {
                                            owner:{ $arrayElemAt: ['$owner', 0] }
                                        }
                                    },
                                  
                                ],
                            },
                        },     
                        {
                            $project: {
                                username: 1,
                                email: 1,
                                fullName: 1,
                                avatar: 1,
                                videos:{
                                   _id: 1,
                                    thumbnail: 1,
                                    title: 1,
                                    description: 1,
                                    duration: 1,
                                    views: 1,
                                    isPublished: 1,
                                    createdAt: 1,
                                    updatedAt: 1,
                                    owner: {
                                        _id: 1,
                                        username: 1,
                                        email: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                            },
                        },
                    },
                    ],
                },
            },
            {
                $unwind: '$channel',
            },
            {
                $unwind: {
                    path: '$channel.videos',
                    preserveNullAndEmptyArrays: true, 
                },
            },
            {
                $sort: {
                    'channel.videos.createdAt': -1
                }
            },
            {
                $group: {
                    _id: null,
                    subscribedChannels: {
                        $addToSet: {
                            _id: '$channel._id',
                            username: '$channel.username',
                            email: '$channel.email',
                            fullName: '$channel.fullName',
                            avatar: '$channel.avatar',
                        },
                    },
                    videos: {
                        $push: '$channel.videos',
                    },
                },
            },

            {
                $project: {
                    _id: 0,
                    subscribedChannels: 1,
                    videos: 1,
                    subscribedChannelsCount: {
                        $size: '$subscribedChannels',
                    },
                },
            },
        ]);
 

    return res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels ,"subscribed channels fetched successfully"));

})

const getUserChannelSubscribers = asyncHandler(async(req, res) => {

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel:req.user?._id
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",   
                pipeline:[
                   { 
                     $project : {
                        username:1,
                        fullName:1,
                        email:1,
                        avatar:1,
                     }
                }
                ]    
            },
            
        },
        {
            $unwind: "$subscriber",
        },
        {
            $replaceRoot: {
                newRoot: "$subscriber",
            },
        },
        {
            $project:{
                username:1,
                fullName:1,
                email:1,
                avatar:1  
            }
        }
    ])

    
    
    
    return res
    .status(200)
    .json(new ApiResponse(200, {
        subscribers,
        subscribersCount: subscribers.length
    } ,"subscribers fetched successfully"));
})


export {
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}

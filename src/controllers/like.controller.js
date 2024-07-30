import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Like } from "../models/like.model.js";

import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Comment } from "../models/comment.model.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "video not found");
  }

  const likedAlready = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  const isLiked = likedAlready ? await Like.findByIdAndDelete(likedAlready._id)
                               : await Like.create({
                                                   video: videoId,
                                                   likedBy: req.user?._id,
                                                   });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedAlready ? {} : isLiked,
        likedAlready ? "like removed from video successfully"
                     : "Like added to video successfully"
      )
    );
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "tweet not found");
  }

  const likedAlready = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user?._id,
  });

  const isLiked = likedAlready ? await Like.findByIdAndDelete(likedAlready._id)
                               : await Like.create({
                                                 tweet: tweetId,
                                                 likedBy: req.user?._id,
                                                 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedAlready ? {} : isLiked,
        likedAlready ? "like removed from tweet successfully"
                     : "Like added to tweet successfully"
      )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid commentId");
  }

  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "comment not found");
  }

  const likedAlready = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });

  const isLiked = likedAlready ? await Like.findByIdAndDelete(likedAlready._id)
                               : await Like.create({
                                   comment: commentId,
                                   likedBy: req.user?._id,
                                 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedAlready ? {} : isLiked,
        likedAlready ? "like removed from comment successfully"
                     : "Like added to comment successfully"
      )
    );
});

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideosAggregate = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    {
                        $unwind: "$owner",
                    },
                ],
            },
        },
        {
            $unwind: "$video",
        },
        {
            $replaceRoot: {
                newRoot: "$video",
            },
        },
        {
            $sort: {
                createdAt: -1,
            },
        },
        {
            $project:{
                    videoFile:1,
                    thumbnail:1,
                    title:1,
                    description:1,
                    views:1,
                    duration:1,
                    createdAt:1,
                    updatedAt:1,
                    isPublished:1,
                    owner:{
                        username:1,
                        fullName:1,
                        avatar:1
                    }
                }
            }
    ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        likedVideosAggregate,
        "liked videos fetched successfully"
      )
    );
});

export { toggleCommentLike, toggleVideoLike, toggleTweetLike, getLikedVideos };

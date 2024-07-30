import mongoose ,{isValidObjectId} from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js";


const createPlaylist = asyncHandler( async (req,res) => {

 const {name, description} = req.body;

if(!name || !description){
    throw new ApiError(400, "name and description both are required ")
}

const playlist = await Playlist.create({
    name,
    description,
    owner:req.user._id
})

if (!playlist) {
    throw new ApiError(500, "failed to create playlist");
}

return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));

})


const updatePlaylist = asyncHandler( async (req,res) => {

    const {name, description} = req.body;

    const {playlistId}= req.params

    if(!name || !description){
        throw new ApiError(400, "name and description both are required ")
    } 

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "playlistId is not valid ");
    }
    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }


if (playlist.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "only owner can edit the playlist");
}


const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,{
   $set:{
    name,
    description
   }
},
{
    new:true
}
)

if (!updatedPlaylist) {
    throw new ApiError(500, "failed to update playlist");
}

return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "playlist updated successfully"));
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId");
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can delete the playlist");
    }

    await Playlist.findByIdAndDelete(playlist?._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "playlist deleted successfully"
            )
        );
});


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "video not found");
    }
    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can add video to the playlist");
    }

const updatedPlaylist=await Playlist.findByIdAndUpdate(playlist?._id,
        {
            $addToSet:{
               videos: videoId
            }
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "failed to add video to playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "video added to playlist successfully"
            )
        );
});




const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid PlaylistId or videoId");
    }

    const playlist = await Playlist.findById(playlistId);
    const video = await Video.findById(videoId);

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (playlist.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can remove video from the playlist");
    }

const updatedPlaylist=await Playlist.findByIdAndUpdate(playlist?._id,
        {
            $pull:{
               videos: videoId
            }
        },
        { new: true }
    );

    if (!updatedPlaylist) {
        throw new ApiError(500, "failed to remove video from playlist");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedPlaylist,
                "video removed from playlist successfully"
            )
        );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId} = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid PlaylistId ");
    }

    const playlist = await Playlist.findById(playlistId);
    
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }
   



const playlistVideos=await Playlist.aggregate([

    {
        $match:{
            _id:new mongoose.Types.ObjectId(playlistId)
        }
    },
    {
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
        }
    },
    {
        $match: {
            "videos.isPublished": true
        }
    },
    {
        $addFields: {
            totalVideos: {
                $size: "$videos"
            },
            owner: {
                $first: "$owner"
            }
        }
    },
    {
    $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
        videos: {
            _id:1,
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            createdAt: 1,
            views: 1
        },
        owner: {
            username: 1,
            fullName: 1,
            avatar: 1
        }
    }
}

])



    if (!playlistVideos) {
        throw new ApiError(500, "failed to fetch playlist videos");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                playlistVideos[0],
                "playlist videos fetched successfully"
            )
        );
});


const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params;
const fetchedPlaylists=await Playlist.aggregate([

    {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
        }
    },
    {
        $addFields: {
            totalVideos: {
                $size: "$videos"
            },
        }
    },
    {
    $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        totalVideos: 1,
    }
}

])



    if (!fetchedPlaylists) {
        throw new ApiError(500, "failed to fetch playlists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                fetchedPlaylists,
                "playlists fetched  successfully"
            )
        );
});


export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getPlaylistById,
    getUserPlaylists,
};
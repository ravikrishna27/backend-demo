import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exists")
    }

    // find if the video was already liked or not. If it was liked Then delete the document
    const existingLike = await Like.findOne({
        video : videoId,
        likedBy : req.user._id
    })
    if(existingLike){
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, {}, "Like was removed")
        )
    }

    // create a like document
    const newLike = await Like.create({
        video : videoId,
        likedBy : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, newLike, "Video liked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment ID")
    }

    const existingLike = await Like.findOne({
        comment : commentId,
        likedBy : req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
        return res.status(201).json(
            new ApiResponse(201, {}, "Like was removed")
        )
    }
    const newLike = await Like.create({
        comment : commentId,
        likedBy : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, newLike, "Comment liked successfully")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid Tweet ID")
    }

    const existingLike = await Like.findOne({
        tweet : tweetId,
        likedBy : req.user._id
    })

    if(existingLike){
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, {}, "Like was removed")
        )
    }
    const newLike = await Like.create({
        tweet : tweetId,
        likedBy : req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, newLike, "Tweet liked successfully")
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const likedVideos = await Like.find({
        likedBy : req.user._id,
        video: { $exists: true, $ne: null }     // have to return the video likes
    }).populate("video")        // replaces the video ObjectId with the actual video document
      .sort({createdAt : -1})


    const videos = likedVideos
        .map(like=>like.video)      //It takes an array of Like documents and creates a new array containing only their video fields
        .filter(Boolean)            // removes entries whose referenced video no longer exists

    return res.status(200).json(
        new ApiResponse(200, videos, "Fetched liked videos successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    /*
        1. Extract the video's ID from the URL.
        2. Read the pagination parameters (page and limit).
        3. Find comments belonging to that video.
        4. Return the comments along with an appropriate API response.

        videoId -> identifies video commentId identifies individual comment
        if there is no video, then there is no need for retriving comments
    */
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exists")
    }

    const comments = await Comment.find({
        video : videoId
    })
    .skip((page-1)*limit)       // skip = (page-1)*limit
    .limit(limit)
    
    return res.status(200).json(
        new ApiResponse(
            200,
            comments,
            "Comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }

    const { content } = req.body
    if(!content || !content.trim()){
        throw new ApiError(400, "Comment shouldn't be empty")
    }
    
    const comment = await Comment.create({
        content,
        video : videoId,
        owner : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, comment, "Commnet added successfully" )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }

    const { content } = req.body
    if(!content || !content.trim()){
        throw new ApiError(400, "Updated Comment shouldn't be empty")
    }

    // check comment's owner is current logged in user or not
    if(!comment.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to update")
    }

    comment.content = content.trim()
    await comment.save()

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404, "Comment doesn't exist")
    }

    if( !comment.owner.equals(req.user._id) ){
        throw new ApiError(403, "Your are not authorized to delete the comment")
    }

    await comment.deleteOne()

    return res.status(200).json(
        new ApiResponse(200,"Comment deleted successfully")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }

import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination.

    // build the filter
    const filter = {
        isPublished : true
    }

    // search for title or description
    if(query?.trim()){
        filter.$or = [
            { title : {$regex: query.trim(), $options: "i"}},
            { description : {$regex: query.trim(), $options: "i"}}
        ]
    }

    // filter by uploader if provided
    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid userId")
        }
        filter.owner = new mongoose.Types.ObjectId(userId)
    }

    // validate pagination
    const pageNum = Number(page)
    const limitNum = Number(limit)
    
    const options = {
        page : pageNum,
        limit : limitNum
    }


    // apply sorting only when requested
    if(sortBy){
        const allowedSortFields = [
            "createdAt",
            "title",
            "views",
            "duration"
        ]

        if(!allowedSortFields.includes(sortBy)){
            throw new ApiError(400, "Invalid sort field")
        }

        const direction = sortType || "desc"
        if(!["asc","desc"].includes(direction)){
            throw new ApiError(404, "Invalid sort type")
        }

        options.sort = {
            [sortBy] : direction === "asc" ? 1 : -1
        }
    }

    // create aggregation pipeline
    const aggregate = Video.aggregate([
        {
            $match : filter
        }
    ])

    // Execute aggregation with pagination
    const videos = await Video.aggregatePaginate(aggregate, options)
    
    return res.status(200).json(
        new ApiResponse(200, videos, "Videos fetched successfully")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    
    // check whether user is authenticated or not? --> JWTVerify is applied for all routes
    // check the title and description first
    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title and description are required")
    }
    // Extract the files
    // validate required fields
    // upload both files to cloudinary
    const videoLocalPath = req.files?.videoFile?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }
    const videoUpload = await uploadOnCloudinary(videoLocalPath)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
    // validate upload
    if(!videoUpload){
        throw new ApiError(500, "Video upload failed")
    }
    if(!thumbnailUpload){
        throw new ApiError(500, "Thumbnail upload failed")
    }

    // create video document
    const video = await Video.create({
        videoFile : videoUpload.secure_url,
        thumbnail : thumbnailUpload.secure_url,
        title, 
        description,
        duration : videoUpload.duration,
        owner : req.user._id
    })
    
    return res.json(201).json(
        new ApiResponse(201, video, "Video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video doesn't exists")
    }

    return res.status(200).json(
        new ApiResponse(200, video, "Video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video doesn't exist")
    }

    // authorization
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const {title, description} = req.body

    if( title !== undefined ){
        if(typeof title !== "string" ||!title.trim()){
            throw new ApiError(400, "Title must be non-empty string")
        }
        video.title = title.trim()
    }
    if( description !== undefined ){
        if(!description.trim()){
            throw new ApiError(400, "Description cannot be empty")
        }
        video.description = description.trim()
    }

    // route has upload.single() ---> req.file
    const thumbnailLocalPath = req.file?.path

    if(thumbnailLocalPath){
        const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)

        if(!thumbnailUpload){
            throw new ApiError(500, "Thumbnail upload failed")
        }
        video.thumbnail = thumbnailUpload.secure_url
    }

    // save and return
    await video.save()
    return res.status(200).json(
        new ApiResponse(200, video, "Video updated successfully")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video doesn't exist")
    }

    // authorization
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to Delete this video")
    }

    // delete that video
    await video.deleteOne()

    return res.status(200).json(
        new ApiResponse(200, {}, "Video has been deleted successfully")
    )

    // NOTE : We are not removing from cloudinary yet.
    // To do that add two more fields into video.model.js storing the public file link returned by cloudinary
    // Then at publishVideo, save the IDs returned by Cloudinary
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video doesn't exist")
    }

    // authorization
    if(!video.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to Toggle Public Status of this video")
    }

    video.isPublished = !video.isPublished
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, "Video Published status toggled")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}

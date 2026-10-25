import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const stats = await Video.aggregate(
        [
            {
                $match: {
                    owner : new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $group: {
                    _id : null,     // is this necessary
                    totalVideos : { $sum : 1 },
                    totalViews : { $sum : "$views" }
                }
            }
        ]
    )

    // const totalSubscribers = await Subscription.aggregate([
    //     {
    //         $match : {
    //             channel : new mongoose.Types.ObjectId(req.user._id) 
    //         }
    //     },
    //     {
    //         $group : {
    //             _id : null,
    //             subscribers : { $sum : 1}
    //         }
    //     }
    // ])

    // or
    const totalSubscribers = await Subscription.countDocuments({
        channel: req.user._id
    })

    // likes
    const videos = await Video.find(
        { owner : req.user._id },
        { _id : 1 }
    )
    // the upper find returns the array of videos that were published by req.user

    const videoIds = videos.map(
        video => video._id
    )

    const totalLikes = await Like.countDocuments({
        video : { $in: videoIds }
    })

    const {totalVideos=0, totalViews=0} = stats[0] ?? []
    const channelStats = {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes
    }
    return res.status(200).json(
        new ApiResponse(200, channelStats, "Channel Stats fetched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { page = 1, limit = 10 } = req.query
    const userId = req.user._id
    
    const pageNum = Number(page)
    const limitNum = Number(limit)

    // query parameters -> strings . Convert them before using
    const videos = await Video.find({
        owner : userId
    })  .sort({createdAt : -1})
        .skip((pageNum-1)*limitNum)
        .limit(limitNum)

    const totalVideos = await Video.countDocuments({
        owner : userId
    })

    const data ={
        videos,
        totalVideos,
        currentPage : pageNum,
        totalPages : Math.ceil(totalVideos/limitNum)
    }

    return res.status(200).json(
        new ApiResponse(200, data, "Channel Videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }
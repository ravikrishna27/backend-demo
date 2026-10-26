import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body

    if (typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    if(content === undefined){
        throw new ApiError(400, "Content shouldn't be empty")
    }

    const tweet = await Tweet.create({
        content : content.trim(),
        owner : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, tweet, "Tweet created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid ID")
    }

    const user = await User.findById(userId)
    if(!user ){
        throw new ApiError(404, "User doesn't exists")
    }
    const tweets = await Tweet.find({
        owner : userId
    }).sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, tweets, "User tweets fetched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { content } = req.body
    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid ID")
    }
    // check authorization
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesn't exists")
    }

    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to modify this tweet");
    }

    if (typeof content !== "string" || !content.trim()) {
        throw new ApiError(400, "Tweet content is required");
    }

    tweet.content = content.trim();
    await tweet.save()

    return res.status(200).json(
        new ApiResponse(200,tweet, "Tweet successfully updated")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params
    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid ID")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404, "Tweet doesn't exists")
    }

    // check authorization
    if (!tweet.owner.equals(req.user._id)) {
        throw new ApiError(403, "You are not authorized to modify this tweet");
    }

    await tweet.deleteOne()
    return res.status(200).json(
        new ApiResponse(200, {}, "Tweet successfully deleted")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}

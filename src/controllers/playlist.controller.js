import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if(!name || !description){
        throw new ApiError(400, "Name and Description are required")
    }

    const playList = await Playlist.create({
        name,
        description,
        owner : req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, playList, "Playlist Created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Not a valid ID")
    }

    const user = await User.findById(userId);
    if(!user){
        throw new ApiError(404, "User doesn't exists")
    }

    const playlists = await Playlist.find({
        owner : userId
    })

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid ID")
    }

    const playList = await Playlist.findById(playlistId).populate("videos")
    if(!playList){
        throw new ApiError(404, "Playlist doesn't exists")
    }

    return res.status(200).json(
        new ApiResponse(200, playList, "playlist fetched successfully")
    )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid ID")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Not a valid ID")
    }

    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exists")
    }

    // check authorization
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to add a video into playlist")
    }

    // push the videoId into the video array
    playlist.videos.push(videoId);

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist to successfully")
    )

    
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid ID")
    }
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Not a valid ID")
    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exists")
    }

    // check authorization
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to add a video into playlist")
    }

    // remove the videoId into the video array
    playlist.videos = playlist.videos.filter(
        (id) => id.toString() !== videoId
    )

    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video Deleted from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid ID")
    }
    const playList = await Playlist.findById(playlistId)
    if(!playList){
        throw new ApiError(404, "Playlist doesn't exists")
    }

    // check authorization
    if(!playList.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    await playList.deleteOne()
    return res.status(200).json(
        new ApiResponse(200,{}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Not a valid ID")
    }
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exists")
    }

    // check authorization
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403, "You are not authorized to delete this playlist")
    }

    if (name !== undefined) {
        playlist.name = name;
    }

    if (description !== undefined) {
        playlist.description = description;
    }
    await playlist.save()
    return res.status(200).json(
        new ApiResponse(200, playlist, "playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

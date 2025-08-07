const ChatMessage = require('../../models/chat.model'); // Adjust the path as needed
const Chatroom = require('../../models/chatRoom.model'); // Adjust the path as needed
const roles = require('../../utils/roles');
const apiResponse = require("../../utils/apiResponse.js");
const CMS = require("../../common-modules/index.js");
const ChatSessions = require('../../models/chatSession.model.js'); // Adjust the path as needed
const { default: mongoose } = require('mongoose');
const { name } = require('ejs');
const Joi = require('joi');
// Controller to get all messages
const getAllMessages = async (req, res) => {
    try {
        const { id } = req.query;
        const filter = {};

        // Role-based filtering
        if (req.doc.role === roles.patient) {
            filter.patientId = mongoose.Types.ObjectId(req.doc.id);
            if (id) filter.chatRoom = mongoose.Types.ObjectId(id);
        } else if (req.doc.role === roles.doctor) {
            filter.doctorId = mongoose.Types.ObjectId(req.doc.id);
            if (id) filter.chatRoom = mongoose.Types.ObjectId(id);
        }

        const messages = await ChatMessage.find(filter)
            .sort({ createdAt: 1 })
            .populate({
                path: 'doctorId',
                select: 'name profileImage'
            })
            .populate({
                path: 'patientId',
                select: 'ownerName name ownerGender'
            });
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

async function chatroomPagin(req, res) {
    try {
        const error = paginateValidation(req.body);
        if (error) {
            return apiResponse.errorMessage(res, 400, error.details[0].message);
        }
        const id = req.doc.id;
        const { page = 1, perPage = 10, searchString = '' } = req.body;
        const startIndex = (page - 1) * perPage;
        const searchRegex = searchString ? new RegExp(searchString, 'i') : "";

        let matchStage = {};

        // Role-based filtering
        if (req.doc.role === roles.patient) {
            matchStage.patientId = mongoose.Types.ObjectId(id);
        }
        if (req.doc.role === roles.doctor) {
            matchStage.doctorId = mongoose.Types.ObjectId(id);
        }
        const basePipeline = [
            {
                $lookup: {
                    from: "doctors",
                    localField: "doctorId",
                    foreignField: "_id",
                    as: "providerDetails"
                }
            },
            { $unwind: "$providerDetails" },
            {
                $lookup: {
                    from: "images",
                    localField: "providerDetails.profileImage",
                    foreignField: "_id",
                    as: "providerDetails.profileImage"
                }
            },
            { $unwind: { path: "$providerDetails.profileImage", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "patients",
                    localField: "patientId",
                    foreignField: "_id",
                    as: "patientDetails"
                }
            },
            { $unwind: { path: "$patientDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: "images",
                    localField: "patientDetails.profileImage",
                    foreignField: "_id",
                    as: "patientDetails.profileImage"
                }
            },
            { $unwind: { path: "$patientDetails.profileImage", preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    ...matchStage,
                    ...(searchRegex && {
                        $or: req.doc.role === roles.doctor
                            ? [
                                { "patientDetails.name": { $regex: searchRegex } }
                            ]
                            : [
                                { "providerDetails.name": { $regex: searchRegex } }
                            ]
                    })
                }
            },
            {
                $lookup: {
                    from: "chats",
                    let: { roomId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$chatRoom", "$$roomId"] },
                                        { $eq: ["$isSeen", false] },
                                        { $eq: ["$senderType", req.doc.role === roles.patient ? "provider" : "patient"] }
                                    ]
                                }
                            }
                        },
                        { $count: "unseenCount" }
                    ],
                    as: "unseenMessages"
                }
            },
            {
                $addFields: {
                    unseenMessageCount: {
                        $ifNull: [{ $arrayElemAt: ["$unseenMessages.unseenCount", 0] }, 0]
                    }
                }
            },
            {
                $unset: "unseenMessages"
            },
            {
                $lookup: {
                    from: "services",
                    localField: "serviceId",
                    foreignField: "_id",
                    as: "serviceId"
                }
            },
            { $unwind: { path: "$serviceId", preserveNullAndEmptyArrays: true } }
        ];

        // Copy of pipeline for data + add pagination & project
        const dataPipeline = [
            ...basePipeline,
            {
                $project: {
                    _id: 1,
                    doctorId: 1,
                    serviceId: 1,
                    isClosed: 1,
                    roomId: 1,
                    lastMessage: 1,
                    lastMessageAt: 1,
                    createdAt: 1,
                    chatRequestId: 1, // <-- Added this line
                    providerDetails: {
                        _id: 1,
                        name: 1,
                        profileImage: {
                            _id: 1,
                            path: 1
                        }
                    },
                    patientDetails: {
                        _id: 1,
                        ownerName: 1,
                        name: 1,
                        ownerGender: 1,
                        ownerImage: {
                            _id: 1,
                            path: 1
                        },
                        color: 1,
                        age: 1,
                        breed: 1
                    },
                    unseenMessageCount: 1
                }
            },
            { $sort: { lastMessageAt: -1 } },
            { $skip: startIndex },
            { $limit: parseInt(perPage) }
        ];

        const countPipeline = [
            ...basePipeline,
            { $count: "totalCount" }
        ];

        const [chatRooms, totalCountArr] = await Promise.all([
            Chatroom.aggregate(dataPipeline),
            Chatroom.aggregate(countPipeline)
        ]);

        const totalCount = totalCountArr[0]?.totalCount || 0;
        return apiResponse.successResWithPagination(res, CMS.Lang_Messages("en", "success"), chatRooms, totalCount);

    } catch (error) {
        console.error(error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}



/**
 * API to check if a chatroom is open for a given patientId and serviceId
 * Expects: { patientId, serviceId }
 */
async function isBookingOpen(req, res) {
    try {
        let patientId = req.doc.id;
        let serviceId = req.params.serviceId;
        if (!patientId || !serviceId) {
            return apiResponse.errorMessage(res, 400, "patientId and serviceId are required");
        }

        const chatRoom = await Chatroom.findOne({
            patientId,
            serviceId,
            isClosed: false
        }).populate({
            path: 'doctorId',
            populate: {
                path: 'profileImage',
                select: '_id path'
            }
        });

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), chatRoom);
    } catch (error) {
        console.error("Error checking chatroom open status:", error);
        return apiResponse.somethingWentWrongMsg(res);
    }
}

const chatroomById = async (req, res) => {
    try {
        const chatRoomId = req.params.id;
        if (!chatRoomId) {
            return apiResponse.errorMessage(res, 400, "Chatroom ID is required");
        }

        const chatRoom = await Chatroom.findById(chatRoomId)
            .populate('serviceId', 'name')
            .populate('doctorId', 'name profileImage')
            .populate('patientId', 'name ownerName color age');

        if (!chatRoom) {
            return apiResponse.errorMessage(res, 400, "Chatroom not found");
        }

        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), chatRoom);
    } catch (error) {
        console.error("Error fetching chatroom by ID:", error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

const getAllChatSessions = async (req, res) => {
    try {
        const doctorId = req.doc.id;

        let chatSessions = await ChatSessions.find({ doctorIds: { $in: [doctorId] }, status: 'pending' })
            .populate('doctorId', 'name profileImage')
            .populate('serviceId', 'name price')
            .populate({
                path: 'patientId',
                select: 'name ownerImage',
                populate: {
                    path: 'ownerImage',
                    select: '_id path',
                    options: { limit: 1 }
                }
            });
        return apiResponse.successResponse(res, CMS.Lang_Messages("en", "success"), chatSessions);
    } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return apiResponse.somethingWentWrongMsg(res);
    }
};

function paginateValidation(body) {
    const schema = Joi.object({
        page: Joi.number().required(),
        perPage: Joi.number().required(),
        searchString: Joi.string().allow("", null)
    });

    const { error } = schema.validate(body);
    return error || null;
}

module.exports = {
    getAllMessages,
    chatroomPagin,
    isBookingOpen,
    getAllChatSessions,
    chatroomById
};
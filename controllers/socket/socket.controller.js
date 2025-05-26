const Chat = require('../../models/chat.model'); // Adjust the path as needed
const roles = require('../../utils/roles');

// Controller to get all messages
const getAllMessages = async (query) => {
    try {
        const { patientId, doctorId } = query;
        const filter = {};

        if (patientId) filter.patientId = patientId;
        if (doctorId) filter.doctorId = doctorId;

        const messages = await Chat.find(filter); // Fetch messages based on the filter
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
};

async function chatroomPagin(req, res) {
    try {
        const error = paginateChatRoomValidator(req.body);
        if (error) {
            return apiResponses.errorMessage(res, 400, error.details[0].message);
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
                                { "patientDetails.fullName": { $regex: searchRegex } }
                            ]
                            : [
                                { "providerDetails.firstName": { $regex: searchRegex } },
                                { "providerDetails.lastName": { $regex: searchRegex } }
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
            }
        ];

        // Copy of pipeline for data + add pagination & project
        const dataPipeline = [
            ...basePipeline,
            {
                $project: {
                    _id: 1,
                    doctorId: 1,
                    roomId: 1,
                    lastMessage: 1,
                    lastMessageAt: 1,
                    createdAt: 1,
                    providerDetails: {
                        _id: 1,
                        firstName: 1,
                        lastName: 1,
                        profileImage: 1
                    },
                    patientDetails: {
                        _id: 1,
                        fullName: 1,
                        profileImage: 1
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
            chatRoom.aggregate(dataPipeline),
            chatRoom.aggregate(countPipeline)
        ]);

        const totalCount = totalCountArr[0]?.totalCount || 0;
        return apiResponses.successResWithPagination(res, CMS.Lang_Messages("en", "success"), chatRooms, totalCount);
        // return apiResponses.successResponse(res, CMS.Lang_Messages("en", "success"), {
        //     data: chatRooms,
        //     totalCount
        // });

    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

async function chatPagin(req, res) {
    try {
        const error = paginateChatValidator(req.body);
        if (error) {
            return apiResponses.errorMessage(res, 400, error.details[0].message);
        }

        const { page = 1, perPage = 10, searchString = '', id } = req.body;
        const startIndex = (page - 1) * perPage;
        const skipCondition = {
            skip: startIndex,
            limit: perPage,
            sort: { createdAt: -1 },
        };

        const searchRegex = searchString ? new RegExp(searchString, 'i') : "";

        let filter = {};

        // Role-based filtering
        if (req.doc.role === roles.patient) {
            filter.patientId = mongoose.Types.ObjectId(req.doc.id);
            filter.chatRoom = mongoose.Types.ObjectId(id);
        }
        if (req.doc.role === roles.doctor) {
            filter.doctorId = mongoose.Types.ObjectId(req.doc.id);
            filter.chatRoom = mongoose.Types.ObjectId(id);
        }
        if (searchRegex) {
            filter.$or = [
                { "message": { $regex: searchRegex } },
                { "senderType": { $regex: searchRegex } }
            ];
        }
        console.log(filter, req.doc)

        const totalCount = await chat.countDocuments(filter);
        // console.log(totalCount, - startIndex - parseInt(perPage))
        const chatRooms = await chat
            .find(filter, {}, skipCondition)
            .populate({
                path: "patientId",
                select: "fullName"
            })
            .populate({
                path: "doctorId",
                select: "firstName lastName"
            })
            // .skip(totalCount - startIndex - parseInt(perPage)) // Adjust skip to fetch data from the end
            .limit(parseInt(perPage));


        return apiResponses.successResWithPagination(res, CMS.Lang_Messages("en", "success"), chatRooms, totalCount);
        // return apiResponses.successResponse(res, CMS.Lang_Messages("en", "success"), {
        //     data: chatRooms,
        //     totalCount,
        // });
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}
module.exports = {
    getAllMessages,
    chatroomPagin
};
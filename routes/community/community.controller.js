const Joi = require("joi");
const roles = require("../../utils/roles.js");
const CMS = require("../../common-modules/index");
const escape = require("../../common-modules/escape.js");
const communityModel = require("../../models/community.model.js");
const apiResponses = require("../../utils/apiResponse.js");

/**
 * Add a new community (only admin or provider)
 */
async function addCommunity(req, res) {
    try {
        const requestData = req.body;
        let role = req.doc.role;
        console.log(req.doc.role)
        if (role === roles.admin || role === roles.doctor) {
            let updateRole = role === 'admin' ? 'Admin' : role;
            const communityData = new communityModel({
                ...requestData,
                createdBy: updateRole,
                createdById: req.doc.id,
            });
            if (role === roles.doctor) {
                communityData.members.push({
                    patientId: null,
                    providerId: req.doc.id,
                    joinedAt: new Date(),
                    userType: role,
                });
            }


            const savedCommunity = await communityData.save();

            if (savedCommunity) {
                return apiResponses.successResponse(res, CMS.Lang_Messages("en", "commAddSuc"), savedCommunity);
            }

            return apiResponses.somethingWentWrongMsg(res);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Get community by ID
 */
async function getCommunity(req, res) {
    try {
        const communityData = await communityModel.findOne({ _id: req.params.id, isDeleted: false }).populate(["image", "createdById"]);

        if (communityData && req.doc) {
            const isMember = communityData.members.some(
                member => member.providerId?.toString() === req.doc.id || member.patientId?.toString() === req.doc.id
            );
            communityData._doc.isMember = isMember; // Add the flag to the response
        }

        if (communityData) {
            return apiResponses.successResponse(res, "Success", communityData);
        }

        return apiResponses.errorMessage(res, 400, `Community ${CMS.Lang_Messages("en", "notF")}`);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Get all communities
 */
async function getAllCommunities(req, res) {
    try {
        const communitiesData = await communityModel.find({ isDeleted: false });

        if (communitiesData) {
            return apiResponses.successResponse(res, "Success", communitiesData);
        }

        return apiResponses.errorMessage(res, 400, `Communities ${CMS.Lang_Messages("en", "notF")}`);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}
/**
 * Get all communities joined by a user
 */
async function getAllCommunitiesJoined(req, res) {
    try {
        let role = req.doc.role;

        if (role === roles.patient) {
            const communitiesData = await communityModel.find({
                isDeleted: false,
                "members.patientId": req.doc.id
            });

            if (communitiesData) {
                return apiResponses.successResponse(res, "Success", communitiesData);
            }

            return apiResponses.errorMessage(res, 400, `Communities ${CMS.Lang_Messages("en", "notF")}`);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Get all communities unjoined by a user
 */

async function getAllCommunitiesUnJoined(req, res) {
    try {
        let role = req.doc.role;

        if (role === roles.patient) {
            const communitiesData = await communityModel.find({
                isDeleted: false,
                "members.patientId": { $ne: req.doc.id }
            });

            if (communitiesData) {
                return apiResponses.successResponse(res, "Success", communitiesData);
            }

            return apiResponses.errorMessage(res, 400, `Communities ${CMS.Lang_Messages("en", "notF")}`);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}


/**
 * Get all communities By search
 */
async function getAllCommunitiesSearch(req, res) {
    try {
        let role = req.doc.role;

        if (role === roles.patient || role === roles.admin) {
            const searchRegex = { $regex: ".*" + req.body.searchString + ".*", $options: "i" };


            const [joinedCommunities, unJoinedCommunities] = await Promise.all([
                communityModel.find({
                    isDeleted: false,
                    "members.patientId": req.doc.id,
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                }).populate(["image", "createdById"]),
                communityModel.find({
                    isDeleted: false,
                    "members.patientId": { $ne: req.doc.id },
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                }).populate(["image", "createdById"])
            ]);

            const communitiesData = {
                joined: joinedCommunities,
                unJoined: unJoinedCommunities
            };

            if (communitiesData) {
                return apiResponses.successResponse(res, "Success", communitiesData);
            }

            return apiResponses.errorMessage(res, 400, `Communities ${CMS.Lang_Messages("en", "notF")}`);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Update a community
 */
async function updateCommunity(req, res) {
    try {
        let role = req.doc.role;
        if (role === roles.admin || role === roles.doctor) {
            const updatedCommunity = await communityModel.findOneAndUpdate(
                { _id: req.params.id, isDeleted: false },
                req.body,
                { new: true }
            );

            if (updatedCommunity) {
                return apiResponses.successResponse(res, "Success", updatedCommunity);
            }

            return apiResponses.dataNotFound(res);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Delete (soft) a community
 */
async function deleteCommunity(req, res) {
    try {
        if (req.doc.role === roles.admin) {
            const deletedCommunity = await communityModel.findOneAndUpdate(
                { _id: req.params.id },
                { isDeleted: true },
                { new: true }
            );

            if (deletedCommunity) {
                return apiResponses.successResponse(res, "Success", deletedCommunity);
            }

            return apiResponses.somethingWentWrongMsg(res);
        }

        return apiResponses.unauthorizedMsg(res);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Paginate community list with search
 */
async function paginateCommunity(req, res) {
    try {
        let role = req.doc.role;
        const startIndex = (req.body.page - 1) * req.body.perPage;
        const perPage = parseInt(req.body.perPage);
        const skipCondition = {
            skip: startIndex,
            limit: perPage,
            sort: { createdAt: -1 },
        };

        const con = { isDeleted: false };

        if (req.body.searchString) {
            con["$or"] = [
                { name: { $regex: ".*" + req.body.searchString + ".*", $options: "i" } },
                { description: { $regex: ".*" + req.body.searchString + ".*", $options: "i" } }
            ];
        }
        if (role === roles.doctor && req.body.type === "my") {
            con["members.providerId"] = req.doc.id;
        }
        if (role === roles.patient && req.body.type === "my") {
            con["members.patientId"] = req.doc.id;
        }

        console.log(role, roles.doctor, req.body.type, "my");

        const communities = await communityModel.find(con, {}, skipCondition).populate(["image", "createdById"]);
        const totalCount = await communityModel.countDocuments(con);
        const communitiesWithFlag = communities.map(community => {
            const isJoined = community.members.some(
                member => {
                    if (role === roles.patient) {
                        return member.patientId?.toString() === req.doc.id;
                    } else if (role === roles.doctor) {
                        return member.providerId?.toString() === req.doc.id;
                    }
                }
            );
            let joinedMembers = community.members?.length || 0;
            delete community._doc.members; // Remove members from response
            return { ...community._doc, isJoined, joinedMembers };
        });
        return apiResponses.successResWithPagination(res, CMS.Lang_Messages("en", "success"), communitiesWithFlag, totalCount);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Paginate public community list with search (no auth required)
 */
async function paginatePublicCommunity(req, res) {
    try {
        const startIndex = (req.body.page - 1) * req.body.perPage;
        const perPage = parseInt(req.body.perPage);
        const skipCondition = {
            skip: startIndex,
            limit: perPage,
            sort: { createdAt: -1 },
        };

        const con = { isDeleted: false };

        if (req.body.searchString) {
            con["$or"] = [
                { name: { $regex: ".*" + req.body.searchString + ".*", $options: "i" } },
                { description: { $regex: ".*" + req.body.searchString + ".*", $options: "i" } }
            ];
        }

        const communities = await communityModel.find(con, {}, skipCondition).populate(["image", "createdById"]);
        const totalCount = await communityModel.countDocuments(con);
        const communitiesWithFlag = communities.map(community => {
            let joinedMembers = community.members?.length || 0;
            delete community._doc.members; // Remove members from response
            return { ...community._doc, joinedMembers };
        });
        return apiResponses.successResWithPagination(res, CMS.Lang_Messages("en", "success"), communitiesWithFlag, totalCount);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Add a member to a community (provider/patient only)
 */
async function addCommunityMember(req, res) {
    try {
        const { id } = req.params;

        const community = await communityModel.findById({
            _id: id,
            isDeleted: false
        });
        if (!community) return apiResponses.errorMessage(res, 404, "Community not found");

        const existingMember = community.members.find(
            member => member.providerId?.toString() === req.doc.id || member.patientId?.toString() === req.doc.id
        );

        if (!existingMember) {
            community.members.push({
                patientId: req.doc.role === roles.patient ? req.doc.id : null,
                providerId: req.doc.role === roles.doctor ? req.doc.id : null,
                joinedAt: new Date(),
                userType: req.doc.role,
            });
            await community.save();
        }

        return apiResponses.successResponse(res, "Member added", community);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Remove a member from a community
 */
async function removeCommunityMember(req, res) {
    try {
        const { id } = req.params;

        const community = await communityModel.findById({
            _id: id,
            isDeleted: false
        });
        if (!community) return apiResponses.errorMessage(res, 404, "Community not found");
        const memberIndex = community.members.findIndex(
            member => member.providerId?.toString() === req.doc.id || member.patientId?.toString() === req.doc.id
        );
        if (memberIndex === -1) return apiResponses.errorMessage(res, 404, "Member not found");
        community.members.splice(memberIndex, 1);
        await community.save();
        return apiResponses.successResponse(res, "Member removed", null);

    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Paginate members of a community
 */
async function paginateCommunityMembers(req, res) {
    try {
        const { communityId, page, perPage } = req.body;
        const community = await communityModel.findById(communityId).populate({
            path: "members",
            options: {
                skip: (page - 1) * perPage,
                limit: perPage
            }
        });

        if (!community) return apiResponses.errorMessage(res, 404, "Community not found");

        const totalMembers = community.members.length;
        return apiResponses.successResWithPagination(res, "Success", community.members, totalMembers);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

/**
 * Upload image for community
 */
async function uploadCommunityImage(req, res) {
    try {
        const community = await communityModel.findById(req.params.id);

        if (!community) return apiResponses.errorMessage(res, 404, "Community not found");
        if (!req.file) return apiResponses.errorMessage(res, 400, "No image uploaded");

        community.image = req.file.path;
        await community.save();

        return apiResponses.successResponse(res, "Image uploaded", community);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

module.exports = {
    addCommunity,
    getCommunity,
    getAllCommunities,
    updateCommunity,
    deleteCommunity,
    paginateCommunity,
    addCommunityMember,
    removeCommunityMember,
    paginateCommunityMembers,
    getAllCommunitiesJoined,
    getAllCommunitiesSearch,
    getAllCommunitiesUnJoined,
    uploadCommunityImage,
    paginatePublicCommunity
};

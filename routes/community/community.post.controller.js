const Post = require('../../models/community_post.model');
const apiResponses = require("../../utils/apiResponse.js");
const roles = require("../../utils/roles.js");
const CMS = require("../../common-modules/index");
const escape = require("../../common-modules/escape.js");
const { default: mongoose } = require('mongoose');

async function createPost(req, res) {
    try {
        const author = req.doc.id; // Assuming req.doc contains the user information
        const authorRole = req.doc.role; // Assuming req.doc contains the user role
        const requestData = req.body;
        const { communityId } = req.params;
        if (!requestData.content && !requestData.image) {
            return apiResponses.errorMessage(res, 400, "Content or image is required");
        }

        const role = req.doc.role == 'admin' ? 'Admin' : req.doc.role;
        const newPost = new Post({
            content: requestData.content,
            image: requestData?.image || null,
            isAnonymouse: requestData?.isAnonymouse || false,
            communityId,
            author,
            authorRole: role
        });
        const savednewPost = await newPost.save();
        if (savednewPost.image) {
            await savednewPost.populate('image');
        }
        if (savednewPost) {
            return apiResponses.successResponse(res, CMS.Lang_Messages("en", "postSuccess"), savednewPost);
        }

        return apiResponses.somethingWentWrongMsg(res);

    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

async function likePost(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.doc.id; // Assuming req.doc contains the user information

        const post = await Post.findById(postId);
        if (!post) {
            return apiResponses.errorMessage(res, 404, CMS.Lang_Messages("en", "postNotFound"));
        }

        let userType = req.doc.role; // Assuming req.doc contains the user role
        userType = userType == 'Admin' ? 'Admin' : userType;
        if (post.likes.some(like => like.userId.toString() === userId && like.userType === userType)) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "alreadyLiked"));
        }
        // Remove dislike if it exists
        post.dislikes = post.dislikes.filter(dislike => !(dislike.userId.toString() === userId && dislike.userType === userType));
        // Add like

        post.likes.push({ userId, userType });
        await post.save();

        return apiResponses.successResponse(res, CMS.Lang_Messages("en", "likeSuccess"), post);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}
async function dislikePost(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.doc.id; // Assuming req.doc contains the user information

        const post = await Post.findById(postId);
        if (!post) {
            return apiResponses.errorMessage(res, 404, CMS.Lang_Messages("en", "postNotFound"));
        }

        let userType = req.doc.role; // Assuming req.doc contains the user role
        userType = userType == 'Admin' ? 'Admin' : userType;
        if (post.dislikes.some(dislike => dislike.userId.toString() === userId && dislike.userType === userType)) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "alreadyDisliked"));
        }
        // Remove like if it exists
        post.likes = post.likes.filter(like => !(like.userId.toString() === userId && like.userType === userType));
        // Add dislike

        post.dislikes.push({ userId, userType });
        await post.save();

        return apiResponses.successResponse(res, CMS.Lang_Messages("en", "dislikeSuccess"), post);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

async function reportPost(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.doc.id; // Assuming req.doc contains the user information
        const report = escape(req.body.report); // Assuming the report is sent in the request body
        const post = await Post.findById(postId);
        if (!post) {
            return apiResponses.errorMessage(res, 404, CMS.Lang_Messages("en", "postNotFound"));
        }

        let userType = req.doc.role; // Assuming req.doc contains the user role
        userType = userType == 'Admin' ? 'Admin' : userType;
        if (post.reports.some(report => report.userId.toString() === userId && report.userType === userType)) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "alreadyReported"));
        }

        post.reports.push({ report, userId, userType });
        await post.save();

        return apiResponses.successResponse(res, CMS.Lang_Messages("en", "reportSuccess"), post);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}
async function paginatePosts(req, res) {
    try {
        const { page = 1, perPage = 10 } = req.body;
        const { communityId } = req.params;
        const userId = req.doc.id;
        const userType = req.doc.role;
        const skip = (page - 1) * perPage;

        const baseMatch = {
            communityId: mongoose.Types.ObjectId(communityId),
            isDeleted: false
        };
        if (userType === 'admin' && req.body.searchString) {
            baseMatch.content = { $regex: ".*" + req.body.searchString + ".*", $options: "i" };
        }
        const aggregationPipeline = [
            { $match: baseMatch },
            { $sort: { 'createdAt': -1 } }, // Corrected sorting by createdAt
            { $skip: skip },
            { $limit: perPage },
            {
                $facet: {
                    doctorPosts: [
                        { $match: { authorRole: 'doctor' } },
                        {
                            $lookup: {
                                from: 'doctors',
                                localField: 'author',
                                foreignField: '_id',
                                as: 'authorDetails'
                            }
                        },
                        { $unwind: { path: '$authorDetails', preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: 'images',
                                localField: 'authorDetails.profileImage',
                                foreignField: '_id',
                                as: 'authorProfileImage'
                            }
                        },
                        {
                            $addFields: {
                                'authorDetails.profileImage': { $arrayElemAt: ['$authorProfileImage', 0] }
                            }
                        },
                        { $project: { authorProfileImage: 0 } }
                    ],
                    patientPosts: [
                        { $match: { authorRole: 'patient' } },
                        {
                            $lookup: {
                                from: 'patients',
                                localField: 'author',
                                foreignField: '_id',
                                as: 'authorDetails'
                            }
                        },
                        { $unwind: { path: '$authorDetails', preserveNullAndEmptyArrays: true } },
                        {
                            $lookup: {
                                from: 'images',
                                localField: 'authorDetails.profileImage',
                                foreignField: '_id',
                                as: 'authorProfileImage'
                            }
                        },
                        {
                            $addFields: {
                                'authorDetails.profileImage': { $arrayElemAt: ['$authorProfileImage', 0] }
                            }
                        },
                        { $project: { authorProfileImage: 0 } }
                    ]
                }
            },
            {
                $addFields: {
                    doctorPosts: {
                        $filter: {
                            input: '$doctorPosts',
                            as: 'post',
                            cond: {}
                        }
                    },
                    patientPosts: {
                        $filter: {
                            input: '$patientPosts',
                            as: 'post',
                            cond: {}
                        }
                    }
                }
            },
            {
                $addFields: {
                    posts: { $concatArrays: ['$doctorPosts', '$patientPosts'] }
                }
            },
            {
                $unwind: '$posts'
            },
            {
                $sort: { 'posts.createdAt': -1 }
            },
            { $unwind: '$posts' },
            { $replaceRoot: { newRoot: '$posts' } },
            {
                $lookup: {
                    from: 'images',
                    localField: 'image',
                    foreignField: '_id',
                    as: 'image'
                }
            },
            {
                $unwind: {
                    path: '$image',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                  from: "community_comment_replies", // MongoDB auto-pluralizes collection names
                  localField: "_id",
                  foreignField: "communityPostObjId",
                  as: "comments"
                }
              },

            {
                $addFields: {
                    commentCount: { $size: "$comments" },
                    likeCount: { $size: { $ifNull: ['$likes', []] } },
                    dislikeCount: { $size: { $ifNull: ['$dislikes', []] } },
                    selfLiked: {
                        $in: [
                            mongoose.Types.ObjectId(userId),
                            {
                                $map: {
                                    input: { $ifNull: ['$likes', []] },
                                    as: 'like',
                                    in: '$$like.userId'
                                }
                            }
                        ]
                    },
                    selfDisliked: {
                        $in: [
                            mongoose.Types.ObjectId(userId),
                            {
                                $map: {
                                    input: { $ifNull: ['$dislikes', []] },
                                    as: 'dislike',
                                    in: '$$dislike.userId'
                                }
                            }
                        ]
                    },
                    viewsCount: { $size: { $ifNull: ['$views', []] } },
                    selfViews: {
                        $in: [
                            mongoose.Types.ObjectId(userId),
                            {
                                $map: {
                                    input: { $ifNull: ['$views', []] },
                                    as: 'view',
                                    in: '$$view.userId'
                                }
                            }
                        ]
                    },
                    isMyPost: {
                        $cond: {
                            if: { $eq: ['$author', mongoose.Types.ObjectId(userId)] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    communityId: 1,
                    author: 1,
                    authorRole: 1,
                    authorDetails: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    image: 1,
                    likeCount: 1,
                    dislikeCount: 1,
                    selfLiked: 1,
                    selfDisliked: 1,
                    isAnonymouse: 1,
                    selfViews: 1,
                    isMyPost: 1,
                    viewsCount: 1,
                    commentCount: 1
                }
            }
        ];


        const [posts, totalCount] = await Promise.all([
            Post.aggregate(aggregationPipeline),
            Post.countDocuments(baseMatch)
        ]);

        return apiResponses.successResWithPagination(res, CMS.Lang_Messages('en', 'success'), posts, totalCount);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}
// async function paginatePosts(req, res) {
//     try {
//         const { page = 1, perPage = 10 } = req.body;
//         const { communityId } = req.params;
//         const userId = req.doc.id;
//         const userType = req.doc.role;

//         const skip = (page - 1) * perPage;

//         const matchQuery = {
//             communityId: mongoose.Types.ObjectId(communityId),
//             isDeleted: false
//         };

//         const posts = await Post.find(matchQuery)
//             .sort({ createdAt: -1 })
//             .skip(skip)
//             .limit(perPage)
//             .populate("author") // refPath: 'authorRole' works here
//             .populate("image")
//             .lean(); // Makes result plain JS objects — faster, better memory

//         const enhancedPosts = posts.map(post => {
//             const likeCount = post.likes?.length || 0;
//             const dislikeCount = post.dislikes?.length || 0;

//             const selfLiked = post.likes?.some(
//                 like => like.userId.toString() === userId
//             );
//             const selfDisliked = post.dislikes?.some(
//                 dislike => dislike.userId.toString() === userId
//             );

//             return {
//                 _id: post._id,
//                 content: post.content,
//                 communityId: post.communityId,
//                 author: post.author,
//                 authorRole: post.authorRole,
//                 authorDetails: post.author, // Optional: rename if needed
//                 image: post.image || null,
//                 createdAt: post.createdAt,
//                 updatedAt: post.updatedAt,
//                 likeCount,
//                 dislikeCount,
//                 selfLiked,
//                 selfDisliked
//             };
//         });

//         const totalCount = await Post.countDocuments(matchQuery);

//         return apiResponses.successResWithPagination(
//             res,
//             CMS.Lang_Messages("en", "success"),
//             enhancedPosts,
//             totalCount
//         );

//     } catch (error) {
//         console.error("paginatePosts error:", error);
//         return apiResponses.somethingWentWrongMsg(res);
//     }
// }


// multiple post views
async function postsViews(req, res) {
    try {
        const { postIds } = req.body;
        const userId = req.doc.id; // Assuming req.doc contains the user information
        let userType = req.doc.role; // Assuming req.doc contains the user role
        userType = userType == 'Admin' ? 'Admin' : userType;
        if (!Array.isArray(postIds) || postIds.length === 0) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "postIdsRequired"));
        }

        const posts = await Post.updateMany(
            {
                author: { $ne: userId }, // Ensure the author is not the same as the userId
                _id: { $in: postIds },
                "views.userId": { $ne: userId } // Ensure userId does not already exist in views
            },
            { $addToSet: { views: { userId, userType } } }
        );

        if (posts) {
            return apiResponses.successResponse(res, CMS.Lang_Messages("en", "viewSuccess"), posts);
        }

        return apiResponses.somethingWentWrongMsg(res);

    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

// deletePost
async function deletePost(req, res) {
    try {
        const { postId } = req.params;
        const userId = req.doc.id; // Assuming req.doc contains the user information
        const userRole = req.doc.role; // Assuming req.doc contains the user role

        const post = await Post.findById(postId);
        if (!post) {
            return apiResponses.errorMessage(res, 400, CMS.Lang_Messages("en", "postNotFound"));
        }

        if (userRole !== roles.admin) {
            return apiResponses.errorMessage(res, 403, CMS.Lang_Messages("en", "notAuthorized"));
        }

        post.isDeleted = true;
        await post.save();

        return apiResponses.successResponse(res, CMS.Lang_Messages("en", "deleteSuccess"), post);
    } catch (error) {
        console.error(error);
        return apiResponses.somethingWentWrongMsg(res);
    }
}

module.exports = { createPost, likePost, dislikePost, reportPost, paginatePosts, postsViews, deletePost };
const Joi = require("joi");
const roles = require("../../utils/roles.js");
const CMS = require("../../common-modules/index");
const escape = require("../../common-modules/escape.js");
const apiResponses = require("../../utils/apiResponse.js");
const communityComments = require("../../models/community.comments.js");
const communityPost = require("../../models/community_post.model.js");
const { log } = require("handlebars");
const { default: mongoose } = require("mongoose");



/**
 * @param {object} req
 * @param {object} res
 * @returns - Community Comment Add
*/
async function addCommunityComment(req, res) {
  try {

    const requestData = req.body;
    const { postId } = req.params;

    //---- fetching data of doctor
    let communityPostData = await communityPost.findOne({ _id: postId });

    if (!communityPostData) {
      return apiResponses.errorMessage(res, 400, `Community Post ${CMS.Lang_Messages("en", "notF")}`)
    }



    let newComment = new communityComments(requestData);
    newComment["communityPostObjId"] = postId;
    newComment["senderId"] = req.doc.id;
    newComment["senderRole"] = req.doc.role;
    newComment["comment"] = requestData.comment;

    // ---- saving......
    const savedComment = await newComment.save();

    let populateOptions = [];
    if (req.doc.role === "doctor") {
      populateOptions = [{ path: "senderId", populate: { path: "profileImage" } }];
    }

    // Remove ownerImage key if present
    if (req.doc.role === "patient" && newComment.senderId && newComment.senderId.ownerImage) {
      delete newComment.senderId.ownerImage;
    }
    let populatedComment = await communityComments.populate(savedComment, populateOptions);

    // If patient, pick only the first ownerImage
    // if (req.doc.role === "patient" && populatedComment.senderId && Array.isArray(populatedComment.senderId.ownerImage)) {
    //   populatedComment.senderId.ownerImage = populatedComment.senderId.ownerImage[0] || null;
    // }

    // ---- if data saved successfully
    if (populatedComment) {
      return apiResponses.successResponse(res, `Comment ${CMS.Lang_Messages("en", "addSuc")}`, populatedComment);
    }

    return apiResponses.somethingWentWrongMsg(res);

  } catch (error) {
    console.error(error);
    return apiResponses.somethingWentWrongMsg(res);
  }
}

/**
 * @param {object} req
 * @param {object} res
 * @returns - Community Comment - Reply Add
*/
async function addCommunityCommentReply(req, res) {
  try {

    const requestData = req.body;
    const { commentId } = req.params;

    //---- fetching data of doctor
    let communityComment = await communityComments.findOne({ _id: commentId });

    if (!communityComment) {
      return apiResponses.errorMessage(res, 400, `Community - Comment ${CMS.Lang_Messages("en", "notF")}`)
    }

    let replyObj = { reply: requestData.comment, role: req.doc.role }

    if (req.doc.role == "doctor") {
      replyObj["doctorId"] = req.doc.id
    }

    else if (req.doc.role == "patient") {
      replyObj["patientId"] = req.doc.id
    }

    else {
      return apiResponses.errorMessage(res, 400, "You cannot Reply to Msg")
    }


    const updatedCommentReply = await communityComments.findByIdAndUpdate(
      { _id: commentId },
      {
        $push: { replies: replyObj } // Push object instead of string
      },
      { new: true } // Return updated document
    ).populate([
      { path: "senderId", populate: { path: "profileImage" } },
      { path: "replies.doctorId", populate: { path: "profileImage" } },
      { path: "replies.patientId", populate: { path: "profileImage" } }
    ])

    // ---- if data saved successfully
    if (updatedCommentReply) {
      return apiResponses.successResponse(res, `Reply ${CMS.Lang_Messages("en", "addSuc")}`, updatedCommentReply);
    }

    return apiResponses.somethingWentWrongMsg(res);

  } catch (error) {
    console.error(error);
    return apiResponses.somethingWentWrongMsg(res);
  }
}


//   get all comment by post id
/**
 * @param {object} req
 * @param {object} res
 * @returns - Get All Comments by Post ID
 */
async function getAllCommentsByPostId(req, res) {
  try {
    const { postId } = req.params;

    // Fetch all comments for the given post ID
    // Fetch all comments for the given post ID
    // Use aggregation to fetch comments and populate senderId and replies' doctorId/patientId
    let comments = await communityComments.aggregate([
      { $match: { communityPostObjId: mongoose.Types.ObjectId(postId) } },
      { $sort: { createdAt: -1 } },
      // Lookup sender (doctor or patient)
      {
      $lookup: {
        from: "doctors",
        localField: "senderId",
        foreignField: "_id",
        as: "doctorSender"
      }
      },
      {
      $lookup: {
        from: "patients",
        localField: "senderId",
        foreignField: "_id",
        as: "patientSender"
      }
      },
      {
      $lookup: {
        from: "images",
        localField: "doctorSender.profileImage",
        foreignField: "_id",
        as: "doctorSenderProfileImage"
      }
      },
      {
      $lookup: {
        from: "images",
        localField: "patientSender.ownerImage",
        foreignField: "_id",
        as: "patientSenderOwnerImage"
      }
      },
      {
      $addFields: {
        senderId: {
        $cond: [
          { $eq: ["$senderRole", "doctor"] },
          {
          $mergeObjects: [
            { $arrayElemAt: ["$doctorSender", 0] },
            { profileImage: { $arrayElemAt: ["$doctorSenderProfileImage", 0] } }
          ]
          },
          {
          $mergeObjects: [
            { $arrayElemAt: ["$patientSender", 0] },
            { ownerImage: { $arrayElemAt: ["$patientSenderOwnerImage", 0] } }
          ]
          }
        ]
        }
      }
      },
      { $project: { doctorSender: 0, patientSender: 0, doctorSenderProfileImage: 0, patientSenderOwnerImage: 0 } },
      // Replies population
      {
      $lookup: {
        from: "doctors",
        localField: "replies.doctorId",
        foreignField: "_id",
        as: "doctorReplies"
      }
      },
      {
      $lookup: {
        from: "patients",
        localField: "replies.patientId",
        foreignField: "_id",
        as: "patientReplies"
      }
      },
      {
      $lookup: {
        from: "images",
        localField: "doctorReplies.profileImage",
        foreignField: "_id",
        as: "doctorRepliesProfileImages"
      }
      },
      {
      $lookup: {
        from: "images",
        localField: "patientReplies.ownerImage",
        foreignField: "_id",
        as: "patientRepliesOwnerImages"
      }
      }
    ]);

    // Attach populated doctor/patient to each reply and clean up
    comments = comments.map(comment => {
      if (Array.isArray(comment.replies) && comment.replies.length) {
      comment.replies = comment.replies.map(reply => {
        if (reply.role === "doctor" && reply.doctorId) {
        let doc = comment.doctorReplies.find(d => d._id.toString() === reply.doctorId?.toString()) || null;
        if (doc) {
          let img = comment.doctorRepliesProfileImages.find(img => img._id.toString() === (doc.profileImage?.toString())) || null;
          doc.profileImage = img;
        }
        reply.doctorId = doc;
        }
        if (reply.role === "patient" && reply.patientId) {
        let pat = comment.patientReplies.find(p => p._id.toString() === reply.patientId?.toString()) || null;
        if (pat) {
          let img = comment.patientRepliesOwnerImages.find(img => img._id.toString() === (pat.ownerImage?.toString())) || null;
          pat.ownerImage = img;
        }
        reply.patientId = pat;
        }
        return reply;
      }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      }
      // For patient, pick only the first ownerImage
      if (comment.senderRole === "patient" && comment.senderId && Array.isArray(comment.senderId.ownerImage)) {
      comment.senderId.ownerImage = comment.senderId.ownerImage[0] || null;
      }
      delete comment.doctorReplies;
      delete comment.patientReplies;
      delete comment.doctorRepliesProfileImages;
      delete comment.patientRepliesOwnerImages;
      return comment;
    });

    // if (!comments || comments.length === 0) {
    //     return apiResponses.errorMessage(res, 201, `No Comments ${CMS.Lang_Messages("en", "notF")}`);
    // }

    return apiResponses.successResponse(res, `${CMS.Lang_Messages("en", "success")}`, comments);
  } catch (error) {
    console.error(error);
    return apiResponses.somethingWentWrongMsg(res);
  }
}





module.exports = {
  addCommunityComment,
  addCommunityCommentReply,
  getAllCommentsByPostId
}

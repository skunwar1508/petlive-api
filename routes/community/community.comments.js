const Joi = require("joi");
const roles = require("../../utils/roles.js");
const CMS = require("../../common-modules/index");
const escape = require("../../common-modules/escape.js");
const apiResponses = require("../../utils/apiResponse.js");
const communityComments = require("../../models/community.comments.js");
const communityPost = require("../../models/community_post.model.js");



/**
 * @param {object} req
 * @param {object} res
 * @returns - Community Comment Add
*/
async function addCommunityComment(req, res) {
    try {
  
      const requestData = req.body;
      const {postId} = req.params;
  
        //---- fetching data of doctor
        let communityPostData = await communityPost.findOne({ _id: postId });
  
        if(!communityPostData){
          return apiResponses.errorMessage(res, 400, `Community Post ${CMS.Lang_Messages("en", "notF")}`)
        }


  
        let newComment = new communityComments(requestData);
        newComment["communityPostObjId"] = postId;
        newComment["senderId"] = req.doc.id;
        newComment["senderRole"] = req.doc.role;
        newComment["comment"] = requestData.comment;
  
        // ---- saving......
        const savedComment = await newComment.save();
  
        const populatedComment = await savedComment.populate([
          { path: "senderId", populate: { path: "profileImage" } },
        ])
  
        // ---- if data saved successfully
        if(populatedComment){
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
        const {commentId} = req.params;
  
        //---- fetching data of doctor
        let communityComment = await communityComments.findOne({ _id: commentId });
  
        if(!communityComment){
          return apiResponses.errorMessage(res, 400, `Community - Comment ${CMS.Lang_Messages("en", "notF")}`)
        }
  
        let replyObj = { reply : requestData.comment, role : req.doc.role }
  
        if(req.doc.role == "doctor"){
          replyObj["doctorId"] = req.doc.id
        }
  
        else if(req.doc.role == "patient"){
          replyObj["patientId"] = req.doc.id
        }
  
        else{
          return apiResponses.errorMessage(res, 400, "You cannot Reply to Msg")
        }
  
  
        const updatedCommentReply = await communityComments.findByIdAndUpdate(
          {_id : commentId},
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
        if(updatedCommentReply){
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
        const comments = await communityComments.find({ communityPostObjId:postId })
            .populate([
                { path: "senderId", populate: { path: "profileImage" } },
                { path: "replies.doctorId", populate: { path: "profileImage" } },
                { path: "replies.patientId", populate: { path: "profileImage" } }
            ])
            .sort({ createdAt: -1 }); // Sort by creation date (newest first)

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
  
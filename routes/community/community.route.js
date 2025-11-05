const express = require('express');
const verifyJWT = require('../../utils/jwt.js');

const router = express.Router();

const {
    addCommunity,
    getCommunity,
    getAllCommunities,
    updateCommunity,
    deleteCommunity,
    paginateCommunity,
    addCommunityMember,
    removeCommunityMember,
    getAllCommunitiesJoined,
    getAllCommunitiesSearch,
    getAllCommunitiesUnJoined
} = require("./community.controller.js");

const {
    createPost,
    // getPost,
    likePost,
    dislikePost,
    reportPost,
    paginatePosts,
    postsViews,
    deletePost
    // viewPost
} = require("./community.post.controller.js");

// const {
//     createComment,
//     getCommentsByPost,
//     likeComment,
//     dislikeComment,
//     reportComment
// } = require("../../controllers/community/comment.controller.js");

const {
    addCommunityValidation,
    communityPaginationValidation,
    addPostValidation,
    postPaginationValidation,
    commentValidation,
} = require("./community.validation.js");
const { addCommunityComment, addCommunityCommentReply, getAllCommentsByPostId } = require('./community.comments.js');
const { addFlag, paginateFlag } = require('./community.flag.js');

// const upload = require('../../middlewares/multer'); // if using multer for images

// 🟢 COMMUNITY ROUTES

router.post("/add", verifyJWT, addCommunityValidation, addCommunity);
router.get("/get/:id", verifyJWT, getCommunity);
router.get("/getall", verifyJWT, getAllCommunities);
router.get("/getall/joined", verifyJWT, getAllCommunitiesJoined);
router.get("/getall/unjoined", verifyJWT, getAllCommunitiesUnJoined);
router.post("/getallBySearch", verifyJWT, getAllCommunitiesSearch);
router.post("/update/:id", verifyJWT, addCommunityValidation, updateCommunity);
// router.delete("/delete/:id", verifyJWT, deleteCommunity);
router.post("/paginate", communityPaginationValidation, paginateCommunity);

// // 🧑‍🤝‍🧑 MEMBER ROUTES

router.get("/member/join/:id", verifyJWT, addCommunityMember);
router.get("/member/leave/:id", verifyJWT, removeCommunityMember);

// // 📝 COMMUNITY POSTS

router.post("/post/:communityId", verifyJWT, addPostValidation, createPost);
router.post("/post/:communityId/paginate", verifyJWT, postPaginationValidation, paginatePosts);
router.get("/post/:postId/like", verifyJWT, likePost);
router.get("/post/:postId/dislike", verifyJWT, dislikePost);
router.post("/post/:postId/report", verifyJWT, reportPost);
router.post("/postviews", verifyJWT, postsViews);
router.delete("/post/:postId/delete", verifyJWT, deletePost);

// router.get("/post/:postId", verifyJWT, getPost);
// router.post("/post/:postId/view", verifyJWT, viewPost);

// // 💬 COMMENTS AND NESTED REPLIES

router.post("/post/:postId/comment", verifyJWT, commentValidation, addCommunityComment);
router.post("/post/:commentId/reply", verifyJWT, commentValidation, addCommunityCommentReply);
router.get("/post/:postId/getAll", verifyJWT, getAllCommentsByPostId);

router.post("/flag/add", verifyJWT, addFlag);
router.post("/flag/paginate", verifyJWT, paginateFlag);

// router.post("/comment/:commentId/reply", verifyJWT, createComment); // nested reply
// router.get("/post/:postId/comments", verifyJWT, getCommentsByPost);

module.exports = router;

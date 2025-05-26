let users = [];
let users2 = [];

// Join user to chat
function userJoin(id, userId, room) {
    const user = { id, userId, room };
    users.push(user);
    return user;
}

function userJoin2 (id, userId) {
    const user = { id, userId };
    users2.push(user);
    return user;
}

// Get current user
function getCurrentUser(id) {
    return users.find((user) => user.id === id);
}

function getCurrentUserByObjectId(userId) {
    return users2.find((user) => user.userId === userId);
}

function removeUser(userId) {
    users = users.filter((user) => user.userId !== userId);
    users2 = users2.filter((user) => user.userId !== userId);
}

module.exports = {
  userJoin,
  userJoin2,
  getCurrentUser,
  getCurrentUserByObjectId,
  removeUser,
};
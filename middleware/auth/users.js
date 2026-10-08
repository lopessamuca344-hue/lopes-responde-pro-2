const { ROLES } = require("./roles");

const users = new Map();

function createUser({
  id,
  name,
  email,
  role = ROLES.USER
}) {
  if (!id || !email) {
    throw new Error("ID e e-mail são obrigatórios");
  }

  if (users.has(id)) {
    throw new Error("Usuário já existe");
  }

  const user = {
    id,
    name: name || "",
    email,
    role,
    createdAt: new Date().toISOString()
  };

  users.set(id, user);

  return user;
}

function getUserById(id) {
  return users.get(id) || null;
}

function listUsers() {
  return Array.from(users.values());
}

module.exports = {
  createUser,
  getUserById,
  listUsers
};

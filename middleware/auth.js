const { hasPermission } = require("../auth/permissions");

function requirePermission(permission) {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        erro: "Não autenticado"
      });
    }

    if (!hasPermission(user.role, permission)) {
      return res.status(403).json({
        erro: "Permissão insuficiente"
      });
    }

    next();
  };
}

module.exports = {
  requirePermission
};

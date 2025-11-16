function ensureSameUser(req, res, next) {
    const paramUserId = parseInt(req.params.userId);
    if (req.user.id !== paramUserId) {
        return res.status(403).json({ error: "Forbidden: you can only access your own bookings." });
    }
    next();
}

module.exports = { ensureSameUser };

// export function ensureSameUserOrAdmin(req, res, next) {

//   const requesterId = String(req.user?.id);
//   const paramUserId = String(req.params.userId);

//   const roles = req.user?.roles || [];

//   if (requesterId === paramUserId || roles.includes("ADMIN")) {
//     return next();
//   }
//   return res.status(403).json({ error: "Forbidden" });
// }
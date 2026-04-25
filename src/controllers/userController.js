const getUserProfile = async (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({
    success: true,
    message: "User profile fetched successfully",
    data: user,
  });
};

export { getUserProfile };

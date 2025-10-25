const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");
const validate = require("../middleware/validationMiddleware");
const { registerValidation, loginValidation } = require("../middleware/validationRules");

router.post("/register", validate(registerValidation), registerUser);
router.post("/login", validate(loginValidation), loginUser);

module.exports = router;

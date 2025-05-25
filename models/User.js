// Third-party modules
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      minlength: 5,
      maxlength: 255,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      validate: [validator.isEmail, "Please provide a valid email"],
    },
    password: {
      type: String,
      // match: [
      //   /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
      //   "Password must be 8 characters or more with a combination of letters and numbers",
      // ],
      select: false,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "nigeria",
    },
    accountName: String,
    accountNumber: String,
    accountBalance: {
      type: Number,
      default: 0,
    },
    bankName: String,
    currency: {
      type: String,
      default: "NGN",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    address: String,
    // emailOTP: String,
    // emailOTPExpire: Date,
  },
  { timestamps: true }
);

/* TASK -> Encrypt user password */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* TASK -> Sign user token */
userSchema.methods.getSignedToken = function () {
  return jwt.sign(
    {
      id: this.id,
      email: this.email,
      accountNumber: this.accountNumber,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY,
    }
  );
};

/* TASK -> Match req.body.password to user password */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/* TASK -> Generate user OTP for Email Verification */
// userSchema.methods.getEmailOTP = async function () {
//   let otp = Math.floor(100000 + Math.random() * 900000);
//   otp = otp.toString();

//   // Encrypt OTP and save in current user's database
//   const salt = await bcrypt.genSalt(10);
//   this.emailOTP = await bcrypt.hash(otp, salt);

//   // Set the OTP Expiration to 30 minutes ahead
//   this.emailOTPExpire = Date.now() + 30 * 60 * 1000;

//   return otp;
// };

/* TASK -> Compare emailOTP with req.body.emailOTP  */
// userSchema.methods.verifyEmailOTP = async function (enteredOTP) {
//   return await bcrypt.compare(enteredOTP, this.emailOTP);
// };

const User = mongoose.model("User", userSchema);

module.exports = User;

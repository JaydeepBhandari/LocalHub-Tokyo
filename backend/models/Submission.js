const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema(
  {
    spotData: { type: Object, required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", SubmissionSchema);

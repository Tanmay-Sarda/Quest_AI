import { response } from "express";
import mongoose from "mongoose";



const storySchema = new mongoose.Schema(
    {
        title: { type: String,required: true },
        description: { type:String, required: true },
        ownerid: [
            new mongoose.Schema({
                owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
                character: { type: String, required: true }
            }, { _id: false }) // disable extra _id inside array
        ],
        content: [
            {
                prompt: { type: String, required: true },
                user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
                response: { type: String, required: true },
            }
        ],
        // content: [contentSchema],
        complete: { type: Boolean, default: false },
        public: { type: Boolean, default: false }
    }, { timestamps: true }
)

export const Story = mongoose.model("Story", storySchema);

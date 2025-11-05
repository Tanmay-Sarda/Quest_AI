import mongoose from "mongoose";
import { User } from "./User.models.js";
import { Story } from "./Story.models.js";


const NotificationSchema = new mongoose.Schema(
    {
     toUser:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},//recipient
     fromUser:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},//sender
     story_id:{type:mongoose.Schema.Types.ObjectId,ref:"Story",required:true},
     //Status with 3 specific values: 0 - pending, 1 - accepted, 2 - rejected
     status:{type:Number,enum:[0,1,2],default:0,required:true} 
    },{ timestamps: true}
);

export const Notification = mongoose.model("Notification", NotificationSchema);
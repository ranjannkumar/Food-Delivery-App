import mongoose from "mongoose";

export const connectDB= async()=>{

  await mongoose.connect('mongodb+srv://ranjankumar:ranjan1807@cluster0.z9euw01.mongodb.net/food-del')
  .then(()=>console.log("DB connected"));
}
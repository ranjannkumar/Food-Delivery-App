import express from "express"
import cors from "cors"



// app config
const app=express()
const port=4000

//middleware
app.use(express.json()) //using this middleware,whenever we get request from frontend to backend that will be parsed using json
app.use(cors()) //we can access backend from frontend

//get method is a http method which will request data from server
app.get("/",(req,res)=>{
  res.send("API working")
}) 

//running express server
app.listen(port,()=>{
  console.log(`Server started on http://localhost:${port}`)
})
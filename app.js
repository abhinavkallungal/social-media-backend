const express = require("express");
const JWT = require("jsonwebtoken");
const path =require('path')
var morgan = require('morgan')
const cors = require('cors')
const bodyParser =require('body-parser')
const UserRouter=require('./routers/User')
const AdminRouter=require('./routers/Admin')
const db = require('./config/connection');

const app=express()

const PORT=4000

app.use(cors());
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.json());


app.use('/api/v1/user/',UserRouter);
app.use('/api/v1/admin/',AdminRouter);

app.use(morgan('tiny'))

db.connect((err)=>{
    if(err){
      console.log(err);
    }else{
      console.log("db connected");
    }
  })




app.listen(PORT,(err)=>{
    if(err){
        console.log(err);
    }else{
        console.log("server started");
    }
})
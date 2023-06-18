//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app =express();

app.use(express.static("public"));

app.set('view engine','ejs');

mongoose.connect('mongodb://127.0.0.1:27017/userDB')

app.use(bodyParser.urlencoded({
    extended:true
}))

const userSchema=new mongoose.Schema({
    email : String,
    password : String
});



const user=new mongoose.model("user",userSchema);



app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser=new user({
            email:req.body.username,
            password:hash
        });
    
        newUser.save()
        .then(function(){
            res.render("secrets");
        })
        .catch(function(err){
            console.log(err);
        })

        
    });
    
});


app.post("/login",function(req,res){
    const username=req.body.username;
    const password=req.body.password;

    user.findOne({email:username})
    .then(function(foundName){
        bcrypt.compare(password, foundName.password, function(err, result) {
            if(result===true){
                res.render("secrets");
            }
        });


    }).catch(function(err){
        console.log(err);
    })
});


app.listen(3000,function(){
    console.log("server started on port 3000")
});
//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app =express();

app.use(express.static("public"));

app.set('view engine','ejs');

app.use(session({
    secret: 'hello there',
    resave: false,
    saveUninitialized: false
  }));

  app.use(passport.initialize());
  app.use(passport.session());


mongoose.connect('mongodb://127.0.0.1:27017/userDB')

app.use(bodyParser.urlencoded({
    extended:true
}));

const userSchema=new mongoose.Schema({
    email : String,
    password : String,
    googleId: String,
    secret:String
});



userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);



const user=new mongoose.model("user",userSchema);

passport.use(user.createStrategy());

// passport.serializeUser(user.serializeUser());
// passport.deserializeUser(user.deserializeUser());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/",function(req,res){
    res.render("home");
});

app.route('/auth/google')

  .get(passport.authenticate('google', {

    scope: ['profile']

  }));

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login "}),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });  

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    user.find({"secret":{$ne:null}})
    .then(foundUser=>{
        res.render("secrets",{usersWithSecrets:foundUser});
    });
    
    
    
});


app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });


app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("login");
    }
})  


app.post("/register",function(req,res){
    user.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

    
});


app.post("/login",function(req,res){
    const ser=new user({
        username:req.body.username,
        password:req.body.password

    });

    req.login(ser,function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            }); 
        }
    })
    
});

// app.post("/submit",function(req,res){
//     const typedSecret=req.body.secret;
//     user.findById(req.user.id)
//     .this((foundUser)=>
//         foundUser.secret=typedSecret;
//         foundUser.save();
//         res.redirect("/secret");
//     )
//     .catch((err)=>
//         console.log(err)
//     )
    
    
    

// });


app.post("/submit", function (req, res) {
    // console.log(req.user);
    user.findById(req.user.id)
      .then(foundUser => {
        if (foundUser) {
          foundUser.secret = req.body.secret;
          return foundUser.save();
        }
        return null;
      })
      .then(() => {
        res.redirect("/secrets");
      })
      .catch(err => {
        console.log(err);
      });
});


app.listen(3000,function(){
    console.log("server started on port 3000")
});
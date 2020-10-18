const Express = require("express");
const BodyParser = require("body-parser");
const Mongoose = require("mongoose");
const Bcrypt = require("bcryptjs");
const path = require('path');
var moment = require('moment');


var cookieParser = require('cookie-parser');

var app = Express();

app.use(cookieParser('null_chapter_is_the_best'));

//app.use(flash());


/*app.use('/css',Express.static(__dirname +'/css'));
app.use('/images',Express.static(__dirname +'/images'));

app.use('/vendor',Express.static(__dirname +'/vendor'));

app.use('/fonts',Express.static(__dirname +'/fonts'));



app.use(Express.static(path.join(__dirname, '')));


 
*/

app.use(BodyParser.urlencoded({ extend: true }));
app.use(BodyParser.json());
//mongodb+srv://admin:password@123@cluster0-ug10m.mongodb.net/test?retryWrites=true&w=majority
Mongoose.connect("mongodb://127.0.0.1:27017/mydb",{ useNewUrlParser: true,useUnifiedTopology: true });



const UserSchema = new Mongoose.Schema({
    username: String,
    email:String,
    password: String,
    loggedin:{ 
        type : Boolean, 
        default: false 
    },
    score:{
        type:INTEGER,
        default:0}
});

UserSchema.pre("save", function(next) {
    if(!this.isModified("password")) {
        return next();
    }
    this.password = Bcrypt.hashSync(this.password, 10);
    next();
});


UserSchema.methods.comparePassword = function(plaintext, callback) {
    return callback(null, Bcrypt.compareSync(plaintext, this.password));
};

const UserModel = new Mongoose.model("user", UserSchema);

app.post("/api/register", async (request, response) => {
    
    try {
       
        var user = new UserModel(request.body);
        var already = await UserModel.findOne({ email: request.body.email }).exec();
        if(!already) {
             var result = await user.save();
        
     return response.json({ message: 'User successfully registered!!' });
        }else{
             
            response.json({ message: 'Email already exists' });

        }
      }catch (error) {
        response.status(501).json({error:'internal server error'});
    }
      
        
    }); 


   

app.post("/api/login", async (request, response) => {
    try {
        var user = await UserModel.findOne({ email: request.body.email }).exec();
        if(!user) {
            return response.status(400).json({message:"The email does not exist"});
        }
        user.comparePassword(request.body.password, (error, match) => {
            try{
            if(!match) {
                return response.status(401).json({message:"Invalid password"});
            }
        
        }catch (error) {
            response.status(501).json({error:'internal server error'});
        }
        
        if(match && user){
        UserModel.findOne({email: request.body.email}, function(err, user){
            if(err)return ("err");
            user.loggedin = true;
            user.save(function(err){
               if(err)return ("err");
               //user has been updated
             });
             
            // response.json({"start-time":moment().unix()});
             
             response.cookie('username', request.body.email,{ maxAge: 900000,signed: true, httpOnly: true });
             
            return response.json({login:true,"start-time":moment().unix()});
           });
        }
    });
    } catch (error) {
        response.status(501).json({error:'internal server error'});
    }
});

app.post("/api/logout",async(request,response)=>{
    try {
        var user = await UserModel.findOne({ email: request.signedCookies['username'] }).exec();
        if(!user) {
            return response.status(400).json({message:"The email does not exist"});
        }
        
        else{
        UserModel.findOne({email: request.signedCookies['username']}, function(err, user){
            if(err)return ("err");
            user.loggedin = false;
            user.save(function(err){
               if(err)return ("err");
               //user has been updated
             });
                return response.json({message:"Logged out sucessfully"});
           });
        }
    
    } catch (error) {
        response.status(501).json({error:'internal server error'});
    }
});




const challenges = require('./challenges.json');
const { INTEGER } = require("sequelize");

app.post("/api/get-challenges", async(request,response)=>{
    try {
        var user = await UserModel.findOne({ email: request.signedCookies['username'] }).exec();
        if(!user) {
            return response.status(400).json({message:"User not registered"});
        }
        
        
        else{
        UserModel.findOne({email: request.signedCookies['username']}, function(err, user){
            if(err)return ("err");
            if(user.loggedin === true) return response.send(JSON.stringify(challenges));
            else return response.json({message:"user not logged in!!"});
           });
        }
    
    } catch (error) {
        response.status(501).json({error:'internal server error'});
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log("Listening at :3000...");
});
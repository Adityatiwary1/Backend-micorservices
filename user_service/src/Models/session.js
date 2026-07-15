const mongoose=require('mongoose')

const sessionschema=mongoose.Schema({
    refresh_token:{
        type:String,
        required:true,
        unique:true,
    },
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',//collectionname
        required:true,
    },
    session_ip:{
        type:String,
        
    },
    device:{
        type:String,
    },
    expires_at:{
        type: Date,
        required:true,
    }
    
},{timestamps:true});
const session= mongoose.Model('session',sessionschema);

sessionschema.index({refresh_token:1});
//sessionschema.index({expires_at:1},{expireafterseconds:0});//findbetteralter  ttl mechnanism
module.exports=session;
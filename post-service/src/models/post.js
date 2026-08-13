const mongoose=require('mongoose');

const postschema=mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:'user'
    },
    content:{
        type:String,
        required:true,
    },
    mediaIDs:[{
        type:String,
    
    }],
   
    
},{timestamps:true});
//postschema.index({content:true});  if no separate serach service
const posts= mongoose.model('post',postschema);
module.exports=posts;
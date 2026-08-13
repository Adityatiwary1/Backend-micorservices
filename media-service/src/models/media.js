const mongoose=require('mongoose');
const mediaschema=mongoose.Schema({
    publicid:{
        type:String,
        required :true
    },
    cloudurl:{
         type : String,
         required : true,
    },
    originalname :{
        type:String,
        required: true,
    },
    mimetype :{
         type:String,
        required: true,
    },
    userid:{
          type:mongoose.Schema.Types.ObjectId ,
          required : true,
          ref:'user'
    }
},{timestamps:true});
const Media=mongoose.model('media',mediaschema);
module.exports=Media;

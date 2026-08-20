const mongoose=require('mongoose');
const mediadelschema=mongoose.Schema({
    publicid:{
        type:String,
        required :true
    },
    cloudurl:{
         type : String,
         
    },
    error :{
         type : String,
         default : null
    },
    unique_eventid:{
        type : String
    },
    status: {
            type: String,
            enum: ['pending','published'],
            default: 'pending',
            index: true
        },
},{timestamps:true});
const Mediadelcloud=mongoose.model('mediadels',mediadelschema);
module.exports=Mediadelcloud;

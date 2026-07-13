const mongoose=require("mongoose")
const argon2=require("argon2")

const Userschema=new mongoose.Schema({
    username: { type :String,//type of data note this is mongoosescehma enforcing not mongodb driver as it is schemaless
               required: true,//this field cannot be blank
               unique:true,//only unique values
               trim: true//trims space form front and back
    },
    email: { type :String,//type of data note this is mongoosescehma enforcing not mongodb driver as it is schemaless
               required: true,//this field cannot be blank
               unique:true,//only unique values
               trim: true,//trims space form front and back
               lowercase:true//convt to lowercase
    },
    password:{
        type: String,
        required: true,
        unique: true,
    },
    createdat:{
        type:Date,
        required=true,
        default: Date.now//caled when craeting  note it si not called now it will eb clale dby mongodb at craetion date.now() give a fixed time to all whne calling here
    },
},{timestamps: true,strict:true}); 
Userschema.pre("save",async function(next){//middleare1.call(document,next)//run before .save() method on upadte you also call .save() on cerate .save() ans ismodifes is true
    if(this.isModified('password')){
        try{
            this.password= await argon2.hash(this.password);//note .save  has already eben this is pre to it
        }
        catch(err){
            return next(err)     ;                //returnt o stop execution if it returns //as handling erro continues eceution after catch
        }
        return next();
    }

    
});//next si  mongoos emiddleware that cotinues before the originla op of update 
//this .call doesnot woek on unnamed async(arrow) is decided  at runtime async  fn.call(thsiarg,normal1,normal2)  sfunctiono fn(a,b) thisarg,a,b,fucntion has this but async() doesnt
Userschema.methods.comparepasssword=async function (candidatepassword) {//custom document method//van all on individual dcoument
    try{
        return await argon2.verify(this.password,candidatepassword);
    }
    catch(err){
        throw error;//pass up
    }
};
//create index for faster order searches
Userschema.index({username:1});
//Userschema.index({username:"text"});
const user =mongoose.model('user',Userschema);
module.exports=user;


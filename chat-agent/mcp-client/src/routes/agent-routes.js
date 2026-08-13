const express=require('express');
const auth=require('../Middleware/authmiddleware');
const {getresponse}=require('../Controllers/assistant')
const router=express.Router();
router.post('/chat',auth,getresponse);

module.exports=router;
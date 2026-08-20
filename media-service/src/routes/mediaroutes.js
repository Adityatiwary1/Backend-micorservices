const express=require('express');
const router=express.Router();
const multer=require('multer');
const auth=require('../Middleware/authmiddleware');
const {uploadmedia,deletemedia} =require('../Controllers/mediapost');
const upload =multer({
    storage:multer.memoryStorage(),
    limits:{fileSize: 10*1024*1024}
}).single('tobeuploadedfile');
router.post('/uploadmedia',auth,upload,uploadmedia);
router.delete('/deletemedia/:id',deletemedia);
module.exports=router;
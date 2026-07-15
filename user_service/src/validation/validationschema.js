//why per api schema validation of req.body not forced typecasting by db drivers clean errors always run unlinke mongodb on update request
//wall for bad data in req before business/controller runs

const joii=require('joi');
const registrationschema=joii.object({//prop must match to reqbody not necesrari to schema as we can change to it in rpocessing
    username : joii.string().min(8).max(20).required(),
    email: joii.string().email().required(),
    password: joii.string().min(8).required(),

})


module.exports=registration_schema;
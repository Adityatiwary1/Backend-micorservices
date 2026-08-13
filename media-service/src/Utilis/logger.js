const winston=require('winston');
const logger=winston.createLogger({level: process.env.ENV==='production'? 'info':'debug',//process.env.ENV||'debug'if not given ie undefiend it will be debug
    format:winston.format.combine(winston.format.timestamp(),winston.format.errors({stack:true}),
winston.format.splat(),winston.format.json()),
defaultMeta:{service:'media-service'},
transports:[
    new winston.transports.Console({
      format:winston.format.combine(
        winston.format.colorize()
    ),
    }),
    new winston.transports.File({filename:'error.log',level:'error'}),//for error and above
    new winston.transports.File({filename:'combined.log'}),//open for all levels  note logger.info this creates highest level info log so transports whihc accept info and lower level will accept higher level threshold transport wont accept it

 ]
});
module.exports=logger;


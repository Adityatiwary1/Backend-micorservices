const amqp=require('amqplib');
const logger=require('./logger');
let connection=null;
let channel=null;
//A routing key is a string made of words separated by dots (.).
//* (Star)
//Matches exactly one word.
//# (Hash)
//Matches zero or more words.
/*Queue A:topic                       vs direct user.create
Binding Key = user.*

Queue B:
Binding Key = order.#*/
const connectrabbitmq=async()=>{//why not try catch error to propogate to caller waiting await
    
           connection =await amqp.connect(process.env.RABBITMQ_URI);
           channel=await connection.createConfirmChannel()
           await channel.assertExchange('Postexchange','topic',{durable:false});
           return ;
   

}
const publish_event=async(routingkey,message)=>{
  if(!channel){
    connection =await amqp.connect(process.env.RABBITMQ_URI);
    channel=await connection.createConfirmChannel()
    await channel.assertExchange('Postexchange','topic',{durable:false});
  }
  channel.publish('Postexchange',routingkey,Buffer.from(JSON.stringify({
    message
  }))
      )
  await channel.waitForConfirms();

  logger.info("Event published successfully");

  return true;

  }
    
  

module.exports={connectrabbitmq,publish_event};
function publishMessage(channel, exchange, routingKey, message) {
  return new Promise((resolve, reject) => {
    channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      {},
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
}
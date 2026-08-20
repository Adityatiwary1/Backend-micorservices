const amqp=require('amqplib');
const logger=require('./logger');
const Outbox= require("../models/rabbitevent");
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
let currentChannel = null;
const rabbitmqconnect= async ()=>{//not handling error will be handled by caller
    const connection = await amqp.connect(process.env.RABBITMQ_URI, {
      recovery: {
        async setup(model) {
          const channel = await model.createConfirmChannel();

          await channel.assertExchange("Postexchange", "topic", {
            durable: true
          });

          currentChannel = channel;
          logger.info('rabbitmq setup complete');
        }
      }
    })
    logger.info('rabbitmq connected');
    connection.on('disconnect', (err) => {
          logger.error('RabbitMQ disconnected', err);
          currentChannel = null;
        });
    return connection;
  }
/*
const connectrabbitmq=async()=>{//why not try catch error to propogate to caller waiting await
    
           connection =await amqp.connect(process.env.RABBITMQ_URI);
           channel=await connection.createConfirmChannel()
           await channel.assertExchange('Postexchange','topic',{durable:false});
           return ;
   

}
           */
const publish_event=async(routingkey,message)=>{
  if(!currentChannel){
    throw new Error("rabbitmq connection channel unavailable")
  }
  currentChannel.publish('Postexchange',routingkey,Buffer.from(JSON.stringify(
    message
  ))
      )
  await currentChannel.waitForConfirms();

  logger.info("Event published successfully");

  return true;

  }
    
const publishoutbox=async (limit)=> {//top level error will be handled by caller //design
    const events = await Outbox.find({
        status: 'pending'
    })
    .limit(limit);

    for (const event of events) {

        try {

            await publish_event(
                event.eventType,
                event.payload
            );//suppose published then mongodb throws error so duplicate event publishing
            //here it wont cause problm but for paymemt systems inventory sytems this is crticial to handle so give an event a unique id
             //consume side handled via transaction ie update but resource and upadte on event are in same transaction
             //while storing generate a unique id while creating the db entry of event event creation is in transaction so one uniue id for every event creation
            await Outbox.updateOne(
                {
                    _id: event._id,
                    status: 'pending'
                },
                {
                    $set: {
                        status: 'published'
                    }
                }
            );

            logger.info(
                `event ${event._id} published successfully`
            );

        } catch (error) {

            logger.error(
                `RabbitMQ publish failed for ${event._id}`,
                error
            );

          try {
            await Outbox.updateOne(
                { _id: event._id },
                {
                    $inc: { attempts: 1 },
                    $set: { lastError: error.message }
                }
            );
         } 
         catch (updateError) {
            logger.error(
                `Failed to record outbox failure for ${event._id}`,
                updateError
            );
        }
            // IMPORTANT:
            // event delete nahi karna.
            // status pending hi rahega.
        }
    }
}


module.exports={publishoutbox,rabbitmqconnect};
/*
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
  */
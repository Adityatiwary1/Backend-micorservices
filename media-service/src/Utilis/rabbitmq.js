const amqp = require("amqplib");
const logger =require('../Utilis/logger');
const Mediadelcloud=require("../models/cloudinarypublicid")
let currentConsumerChannel=null;
const rabbitmqConsumerConnect = async () => {
  logger.info('set up of rabbitmq');
  const connection = await amqp.connect(process.env.RABBITMQ_URI, {
    recovery: {
      maxRetries: 1,
      initialDelay: 1000,
      async setup(model) {
        const channel = await model.createChannel();

        await channel.assertExchange("Postexchange", "topic", {
          durable: true,
        });

        await channel.assertQueue("PostQueue", {
          durable: true,
        });

        await channel.bindQueue(
          "PostQueue",
          "Postexchange",
          "post.delete"
        );

        
        currentConsumerChannel = channel;
        

        logger.info("RabbitMQ consumer ready");
      },
    },
  });

  connection.on("disconnect", (err) => {
    logger.error("RabbitMQ consumer disconnected", err);

    currentConsumerChannel = null;
    consumerTag = null;
  });

  connection.on("connect", () => {
    logger.info("RabbitMQ consumer connected/reconnected");
  });
  logger.info('set up complete');
  return connection;
};
const consume_events=async()=>{
  if(currentConsumerChannel){
    const result = await currentConsumerChannel.consume(
              "PostQueue",
              async (message) => {
                if (!message) return;

                try {
                  const data = JSON.parse(message.content.toString());
                  const entries = data.mediaIDs.map((mediaID) => ({
                      publicid: mediaID
                    }));
  
                   await Mediadelcloud.insertMany(entries, {
                      ordered: true
                    });//by this duplicate publicid will give be given to delete but none will be missed  an #improvement needed 
                    //use unique event id from consumer if duplication op can cause app logic error

                   currentConsumerChannel.ack(message);
                   logger.info('published and acknowledged');
                } catch (err) {
                  logger.error("Error processing RabbitMQ message", err);

                  // Choose your desired failure strategy
                  currentConsumerChannel.nack(message, false, true);
                }
              }
            );
          }
          }
module.exports={consume_events,rabbitmqConsumerConnect};
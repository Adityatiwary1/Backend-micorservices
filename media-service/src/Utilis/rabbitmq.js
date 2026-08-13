const amqp = require("amqplib");
const logger =require('../Utilis/logger');
class RabbitMQService {
  constructor(uri) {
    this.connection = null;
    this.channel = null;
    this.counter=0;
    this.uri=uri;
  }

  async connect() {
    this.connection = await amqp.connect(this.uri);

    this.channel = await this.connection.createChannel();
    

   

    console.log("RabbitMQ connected");

    this.connection.on("close", async() => {
      try{
      console.log("RabbitMQ connection closed retrying");
      await this.reconnect();
      }
      catch(err){
        logger.error(err.message);
      
      }
    });

    this.connection.on("error", (err) => {
      console.error("RabbitMQ error", err.message);
      
    });
  }

  async reconnect() {
     this.channel = null;
     this.connection = null;

     while (this.counter < 10) {
        try {
         await this.connect();
         this.counter = 0;
         return;
        } 
        catch (err) {
         this.counter++;
         console.log(`Reconnect attempt failed ${this.counter}`);
         }
       }

     throw new Error("Maximum reconnect attempts to rabbitmq reached");
   }
   async consumeevent()

}
module.exports=new RabbitMQService();
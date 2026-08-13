const {  StateGraph,
  START,
  END,
  MessagesAnnotation
} =require("@langchain/langgraph");
const { ToolNode, toolsCondition } =require("@langchain/langgraph/prebuilt");
const { HumanMessage } =require("@langchain/core/messages");
const { RedisSaver } = require("@langchain/langgraph-checkpoint-redis");
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { Client } =require("@modelcontextprotocol/sdk/client/index.js");
const { StreamableHTTPClientTransport } = require( "@modelcontextprotocol/sdk/client/streamableHttp.js");
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
//const { createClient } = require("redis");
//const Redis = require("ioredis");
const { SystemMessage } =require( "@langchain/core/messages");

const connectMCP=async () =>{
  const obj={};
  try{
  // Existing MCP server endpoint
  
  const MCP_SERVER_URL = process.env.MCP_SERVER_URI;


  const transport = new StreamableHTTPClientTransport(
    new URL(MCP_SERVER_URL)
  );


  const mcpclient = new Client(
    {
      name: "node-mcp-client",
      version: "1.0.0"
    }
  );


  // Connect MCP client to server
  await mcpclient.connect(transport);
  obj.mcpclient=mcpclient;
  console.log("Connected to MCP server");


  // Get available tools
  let mcptools = await mcpclient.listTools();

  tools = mcptools.tools.map(
  (tool) =>{
    return new DynamicStructuredTool({
         name: tool.name,
       description: tool.description,
      schema: tool.inputSchema,
      func: async (args) => {
        try{
        const result=await mcpclient.callTool({//if mcp api fails at serverthat unhandled tnrow wiil propgate here rguarantetd by mcp protocol+nodejs so await will reject throw
          name: tool.name,//2nd approach i sent handle eror at cmps erve rand wirtie in repsosne.content.text
          arguments: args,
        });//if it fails at client send then llm will answer form its own knowledge//err,emssage will show client side error of this fn
         return result.content.map((c) => {
              
                return c.text;
             
            }).join("\n");//craete tool msg form string mcp output result.cpnent.text stringify conatins actual msg whihc i ahve defined this output structure in mcp server
          }
        catch(err)  {
             return`
                status: "error",
                error_type: "TOOL_FAILURE",
                message:${ err.message}
              `
        }     //if not try catch thrpw propgtaion from cp tehn graph will stop with ahndletooleeror langraph in toolnode   
      },
    })
  }
  );
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-3.5-flash-lite",
    temperature: 0,
    apiKey: process.env.GOOGLE_API_KEY,
    });
  const modelWithTools = model.bindTools(tools);
  const llmnode=async(state)=> {//async(state,config)
     const response = await modelWithTools.invoke(
       [
      new SystemMessage(
        `You are a helpful assistant. Use tools when needed.
              Tool responses may contain errors.
              If a tool response contains:
              - status: "error"
              - error_type
              - error message
              then:
              Treat the tool call as failed.
              Do not assume the requested operation succeeded.
              Do not invent data or tool results.
              Explain the failure briefly to the user.
              If possible, provide an alternative way to help.`
                    ),
      ...state.messages//spread
       ],
       //config
        );
//llm return aimessage //sens system msg tool desc as part of ip to llm but do not store them instate AImsg toolcall tool op store in state ie why in llm call passed sys tool desc
     return {
       messages: [response],//asper annotaionmessage state sturcture //state update obj  which parts of state to upadaye  mwssage annotation {messages:[]} reducer appends to it
     };
}
  const graphbuilder=new StateGraph(MessagesAnnotation)
  .addNode("LLMnode",llmnode )
  .addNode("tools", new ToolNode(tools))
  .addConditionalEdges("LLMnode", toolsCondition)
  .addEdge("tools", "LLMnode")
  .addEdge(START, "LLMnode");
  /*const redisClient = createClient({
                 url: process.env.REDIS_URI,
                            });

  await redisClient.connect();
  obj.redisclient=redisClient;*/
 
/*
  const redisClient = new Redis(process.env.REDIS_URI);
  await new Promise((resolve, reject) => {
  redisClient.once("ready", resolve);
  redisClient.once("error", reject);
       });
  const checkpointer = new RedisSaver({
    client: redisClient,
  });
  obj.redisclient=redisClient;
  */
  const graph = graphbuilder.compile(
   /* {
    checkpointer,
  }*/
 );
  obj.graph=graph;
  return obj;
 }
 catch(err){
      err.obj=obj;
      throw err;
 }
}
module.exports={connectMCP};

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const createmcpobj=()=>{
    const server = new McpServer({
        name: "assistant-server",
        version: "1.0.0",
    });
    const { z } =require("zod");
    server.tool(
      "tavily_search",
      "Search the web using Tavily ",
      {
        query: z.string()
          .describe("The search query"),

        max_results: z.number()
          .min(1)
          .max(20)
          .default(5)
          .describe("Number of documents to retrieve"),
      },

      async ({ query, max_results }) => {

        const response = await fetch(
          "https://api.tavily.com/search",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization":
                `Bearer ${process.env.TAVILY_API_KEY}`,
            },
            body: JSON.stringify({
              query,
              max_results,
              search_depth: "basic",
              include_answer: true,
              include_raw_content: true,
            }),
          }
          );
        if (!response.ok) {
          throw new Error(
            `Tavily failed: ${response.status}`
          );
              }
          const data =await response.text();
          return {
          content: [
            {
              type: "text",
              text: data,
            } ] }
        }

    )
    return server;
  }

module.exports=createmcpobj;
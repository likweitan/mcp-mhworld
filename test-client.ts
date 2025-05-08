import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

async function testMhwServer() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/mhw-mcp-server.js"],
  });

  const client = new Client({
    name: "mhw-test-client",
    version: "1.0.0",
  });

  try {
    console.log("Connecting to MHW MCP server...");
    await client.connect(transport);
    console.log("Connected successfully!\n");

    // Test monster search
    console.log("Testing monster search...");
    const monsterResult = await client.callTool({
      name: "find-monster",
      arguments: {
        name: "Rathalos"
      }
    }) as ToolResponse;
    console.log("Monster search result:");
    console.log(monsterResult.content[0].text);
    console.log();

    // Test weapon crafting path
    console.log("Testing weapon crafting path...");
    const weaponResult = await client.callTool({
      name: "find-weapon-path",
      arguments: {
        name: "Iron Katana"
      }
    }) as ToolResponse;
    console.log("Weapon crafting path result:");
    console.log(weaponResult.content[0].text);
    console.log();

    // Test armor search by skill
    console.log("Testing armor search by skill...");
    const armorResult = await client.callTool({
      name: "find-armor-by-skill",
      arguments: {
        skill: "Attack Boost"
      }
    }) as ToolResponse;
    console.log("Armor search result:");
    console.log(armorResult.content[0].text);
    console.log();

    // Test monster guide prompt
    console.log("Testing monster guide prompt...");
    const guidePrompt = await client.getPrompt({
      name: "monster-guide",
      arguments: {
        monster: "Nergigante"
      }
    });
    console.log("Monster guide prompt:");
    console.log(guidePrompt.messages[0].content.text);
    console.log();

    // Test farming guide prompt
    console.log("Testing farming guide prompt...");
    const farmingPrompt = await client.getPrompt({
      name: "farming-guide",
      arguments: {
        item: "Wyvern Gem"
      }
    });
    console.log("Farming guide prompt:");
    console.log(farmingPrompt.messages[0].content.text);
    console.log();

    // Test build planner prompt
    console.log("Testing build planner prompt...");
    const buildPrompt = await client.getPrompt({
      name: "build-planner",
      arguments: {
        weapon: "Long Sword",
        playstyle: "Critical Draw"
      }
    });
    console.log("Build planner prompt:");
    console.log(buildPrompt.messages[0].content.text);

  } catch (error) {
    console.error("Error:", error);
  }
}

testMhwServer().catch(console.error);
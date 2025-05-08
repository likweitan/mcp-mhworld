// Global error handlers for better diagnostics
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1); // Ensure process exits on uncaught exception
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1); // Ensure process exits on unhandled rejection
});

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod"; // Standard Zod import

interface Monster {
  id: number;
  name: string;
  type: string;
  species: string;
  description: string;
  locations: Array<{ name: string }>;
  weaknesses: Array<{ element: string; stars: number }>;
}

interface Weapon {
  id: number;
  name: string;
  crafting?: {
    craftingMaterials: Array<{
      quantity: number;
      item: {
        name: string;
        description: string;
      };
    }>;
    previous: number | undefined;
  };
}

interface ArmorPiece {
  name: string;
  type: string;
  rarity: number;
  defense: {
    base: number;
    max: number;
  };
  skills: Array<{
    skillName: string;
    level: number;
  }>;
  crafting: {
    materials: Array<{
      quantity: number;
      item: {
        name: string;
      };
    }>;
  };
}

interface CraftingStep {
  name: string;
  materials: string[];
}

interface Ailment {
  id: number;
  name: string;
  description: string;
  recovery: {
    actions: string[];
    items: Array<{
      name: string;
      description: string;
    }>;
  };
}

interface Charm {
  id: number;
  name: string;
  level: number;
  rarity: number;
  skills: Array<{
    skillName: string;
    level: number;
  }>;
}

interface Decoration {
  id: number;
  name: string;
  rarity: number;
  skills: Array<{
    skillName: string;
    level: number;
  }>;
}

interface Location {
  id: number;
  name: string;
  zoneCount: number;
  camps: Array<{
    name: string;
    zone: number;
  }>;
}

interface Skill {
  id: number;
  name: string;
  description: string;
  levels: Array<{
    level: number;
    description: string;
  }>;
}

interface Event {
  id: number;
  name: string;
  description: string;
  requirements: string;
  success_conditions: string[];
  rewards: Array<{
    item: {
      name: string;
      description: string;
    };
    quantity: number;
  }>;
}

console.log("Initializing MHW MCP Server...");

const serverConfig = {
  name: "mhw-helper",
  version: "1.0.1",
};

// Create base MCP server
const server = new McpServer(serverConfig);
console.log(`Server created: ${serverConfig.name} v${serverConfig.version}`);

// Track registered items for logging
const registeredItems = {
  resources: [] as string[],
  tools: [] as string[],
  prompts: [] as string[],
};

// Cache for API responses
const cache = new Map<string, any>();

// Base API URL
const API_BASE = "https://mhw-db.com";

// Fetch with caching
async function fetchWithCache(endpoint: string) {
  console.log(`Fetching from API or cache: ${API_BASE}${endpoint}`);
  if (cache.has(endpoint)) {
    console.log(`Cache hit for: ${endpoint}`);
    return cache.get(endpoint);
  }
  console.log(`Cache miss for: ${endpoint}. Fetching from API.`);
  const response = await fetch(`${API_BASE}${endpoint}`);
  if (!response.ok) {
    console.error(`API Error for ${endpoint}: ${response.status} ${response.statusText}`);
    throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
  }
  const data = await response.json();
  cache.set(endpoint, data);
  console.log(`Successfully fetched and cached: ${endpoint}`);
  return data;
}

// Resources
console.log("Registering resources...");

// Root resource listing
server.resource(
  "mhw-root",
  "mhw:///",
  {
    description: "MHW API Root - Lists all available resources"
  },
  async (uri) => {
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          description: "Monster Hunter World API Resources",
          version: serverConfig.version,
          resources: [
            { uri: "mhw:///monsters", description: "Get monster information and statistics" },
            { uri: "mhw:///armor/sets", description: "Browse armor sets and their bonuses" },
            { uri: "mhw:///ailments", description: "View status effects and recovery methods" },
            { uri: "mhw:///charms", description: "Access charm upgrade paths and materials" },
            { uri: "mhw:///decorations", description: "Find decoration skills and rarities" },
            { uri: "mhw:///events", description: "Check event quests and schedules" },
            { uri: "mhw:///items", description: "Look up items and materials" },
            { uri: "mhw:///locations", description: "Explore game areas and camps" },
            { uri: "mhw:///motion-values", description: "View weapon attack data" },
            { uri: "mhw:///skills", description: "Research skills and their effects" },
            { uri: "mhw:///weapons", description: "Browse weapons and upgrade trees" }
          ]
        }, null, 2)
      }]
    };
  }
);
registeredItems.resources.push("mhw-root");

// Available resources
const resources = [
  { path: 'monsters', name: 'Monster Database' },
  { path: 'armor/sets', name: 'Armor Sets' },
  { path: 'ailments', name: 'Status Effects' },
  { path: 'charms', name: 'Charms' },
  { path: 'decorations', name: 'Decorations' },
  { path: 'events', name: 'Event Quests' },
  { path: 'items', name: 'Items Database' },
  { path: 'locations', name: 'Locations' },
  { path: 'motion-values', name: 'Motion Values' },
  { path: 'skills', name: 'Skills' },
  { path: 'weapons', name: 'Weapons' }
];

// Register list resources
resources.forEach(({ path, name }) => {
  // Register list endpoint
  server.resource(
    `${path}-list`,
    `mhw:///${path}`,
    { description: `List all ${name.toLowerCase()}` },
    async (uri) => {
      try {
        const data = await fetchWithCache(`/${path}`);
        return {
          contents: [{
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2)
          }]
        };
      } catch (error) {
        console.error(`Error fetching ${name} list:`, error);
        throw error;
      }
    }
  );

  // Register individual resource endpoint
  server.resource(
    path,
    new ResourceTemplate(`mhw:///${path}/{id}`, { list: undefined }),
    { description: `Get specific ${name.toLowerCase()} by ID` },
    async (uri, { id }) => {
      try {
        const data = await fetchWithCache(`/${path}/${id}`);
        return {
          contents: [{
            uri: uri.href,
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2)
          }]
        };
      } catch (error) {
        console.error(`Error fetching ${path} ${id}:`, error);
        throw error;
      }
    }
  );

  registeredItems.resources.push(path, `${path}-list`);
});

// Tools
console.log("Registering tools...");
server.tool(
  "find-monster",
  { name: z.string() },
  async ({ name }: { name: string }) => {
    console.log(`Tool 'find-monster' called with name: ${name}`);
    try {
      const monsters: Monster[] = await fetchWithCache("/monsters");
      const monster = monsters.find((m) => 
        m.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (!monster) {
        console.log(`No monster found matching "${name}"`);
        return {
          content: [{ 
            type: "text", 
            text: `No monster found matching "${name}"`
          }]
        };
      }
      console.log(`Found monster: ${monster.name}`);

      const locations = monster.locations.map((l) => l.name).join(", ");
      const weaknesses = monster.weaknesses
        .filter((w) => w.stars > 0)
        .map((w) => `${w.element} (${w.stars}★)`)
        .join(", ");

      const resultText = `
Monster: ${monster.name}
Type: ${monster.type}
Species: ${monster.species}
Locations: ${locations || "Unknown"}
Weaknesses: ${weaknesses || "None"}
Description: ${monster.description}
      `.trim();
      console.log(`Result for 'find-monster' (${name}):\n${resultText}`);
      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      console.error(`Error in 'find-monster' tool for name ${name}:`, error);
      return { content: [{ type: "text", text: `Error finding monster: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-monster");
console.log("Registered tool: find-monster");

server.tool(
  "find-weapon-path",
  { name: z.string() },
  async ({ name }: { name: string }) => {
    console.log(`Tool 'find-weapon-path' called with name: ${name}`);
    try {
      const weapons: Weapon[] = await fetchWithCache("/weapons");
      const weapon = weapons.find((w) => 
        w.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!weapon) {
        console.log(`No weapon found matching "${name}"`);
        return {
          content: [{ 
            type: "text", 
            text: `No weapon found matching "${name}"`
          }]
        };
      }
      console.log(`Found weapon: ${weapon.name}`);

      const craftingPath: CraftingStep[] = [];
      let current: Weapon | undefined = weapon;
      
      while (current) {
        const materials = current.crafting?.craftingMaterials || [];
        craftingPath.push({
          name: current.name,
          materials: materials.map((m) => 
            `${m.quantity}x ${m.item.name} (from ${m.item.description})`
          )
        });
        
        const previousId: number | undefined = current.crafting?.previous;
        if (previousId) {
          current = weapons.find((w) => w.id === previousId);
        } else {
          current = undefined;
        }
      }

      craftingPath.reverse();
      const resultText = `
Crafting path for ${weapon.name}:

${craftingPath.map((step, i) => `
${i + 1}. ${step.name}
   Materials needed:
   ${step.materials.map((m) => `   - ${m}`).join('\n')}
`).join('\n')}
      `.trim();
      console.log(`Result for 'find-weapon-path' (${name}):\n${resultText}`);
      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      console.error(`Error in 'find-weapon-path' tool for name ${name}:`, error);
      return { content: [{ type: "text", text: `Error finding weapon path: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-weapon-path");
console.log("Registered tool: find-weapon-path");

server.tool(
  "find-armor-by-skill",
  { skill: z.string() },
  async ({ skill }: { skill: string }) => {
    console.log(`Tool 'find-armor-by-skill' called with skill: ${skill}`);
    try {
      const armor: ArmorPiece[] = await fetchWithCache("/armor");
      const matches = armor.filter((a) =>
        a.skills.some((s) => 
          s.skillName.toLowerCase().includes(skill.toLowerCase())
        )
      );

      if (matches.length === 0) {
        console.log(`No armor pieces found with skill matching "${skill}"`);
        return {
          content: [{
            type: "text",
            text: `No armor pieces found with skill matching "${skill}"`
          }]
        };
      }
      console.log(`Found ${matches.length} armor pieces with "${skill}" skill`);

      const resultText = `
Found ${matches.length} armor pieces with "${skill}" skill:

${matches.map((piece) => `
${piece.name} (${piece.type})
- Rarity: ${piece.rarity}
- Defense: ${piece.defense.base} (base) -> ${piece.defense.max} (max)
- Skills: ${piece.skills.map((s) => `${s.skillName} Lv${s.level}`).join(', ')}
- Crafting: ${piece.crafting.materials.map((m) => 
  `${m.quantity}x ${m.item.name}`
).join(', ')}
`).join('\n')}
      `.trim();
      console.log(`Result for 'find-armor-by-skill' (${skill}):\n${resultText}`);
      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      console.error(`Error in 'find-armor-by-skill' tool for skill ${skill}:`, error);
      return { content: [{ type: "text", text: `Error finding armor by skill: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-armor-by-skill");
console.log("Registered tool: find-armor-by-skill");

// Add new tools for remaining endpoints
server.tool(
  "find-ailment-info",
  { name: z.string() },
  async ({ name }: { name: string }) => {
    console.log(`Tool 'find-ailment-info' called with name: ${name}`);
    try {
      const ailments: Ailment[] = await fetchWithCache("/ailments");
      const ailment = ailments.find((a) =>
        a.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!ailment) {
        return {
          content: [{
            type: "text",
            text: `No ailment found matching "${name}"`
          }]
        };
      }

      const resultText = `
Ailment: ${ailment.name}
Description: ${ailment.description}
Recovery Actions: ${ailment.recovery.actions.join(", ") || "None"}
Recovery Items: ${ailment.recovery.items.map(i => i.name).join(", ") || "None"}
      `.trim();

      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error finding ailment: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-ailment-info");

server.tool(
  "find-events",
  { active: z.boolean().optional() },
  async ({ active }: { active?: boolean }) => {
    console.log(`Tool 'find-events' called with active: ${active}`);
    try {
      const events: Event[] = await fetchWithCache("/events");
      let filteredEvents = events;

      const resultText = `
Available Events:

${filteredEvents.map(event => `
Name: ${event.name}
Description: ${event.description}
Requirements: ${event.requirements}
Success Conditions: ${event.success_conditions.join(", ")}
Rewards: ${event.rewards.map(r => `${r.quantity}x ${r.item.name}`).join(", ")}
`).join('\n---\n')}
      `.trim();

      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error finding events: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-events");

server.tool(
  "find-skill-info",
  { name: z.string() },
  async ({ name }: { name: string }) => {
    console.log(`Tool 'find-skill-info' called with name: ${name}`);
    try {
      const skills: Skill[] = await fetchWithCache("/skills");
      const skill = skills.find((s) =>
        s.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!skill) {
        return {
          content: [{
            type: "text",
            text: `No skill found matching "${name}"`
          }]
        };
      }

      const resultText = `
Skill: ${skill.name}
Description: ${skill.description}

Levels:
${skill.levels.map(l => `Level ${l.level}: ${l.description}`).join('\n')}
      `.trim();

      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error finding skill: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-skill-info");

server.tool(
  "find-location-info",
  { name: z.string() },
  async ({ name }: { name: string }) => {
    console.log(`Tool 'find-location-info' called with name: ${name}`);
    try {
      const locations: Location[] = await fetchWithCache("/locations");
      const location = locations.find((l) =>
        l.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!location) {
        return {
          content: [{
            type: "text",
            text: `No location found matching "${name}"`
          }]
        };
      }

      const resultText = `
Location: ${location.name}
Number of Zones: ${location.zoneCount}
Camps:
${location.camps.map(c => `- ${c.name} (Zone ${c.zone})`).join('\n')}
      `.trim();

      return { content: [{ type: "text", text: resultText }] };
    } catch (error) {
      return { content: [{ type: "text", text: `Error finding location: ${(error as Error).message}` }], isError: true };
    }
  }
);
registeredItems.tools.push("find-location-info");

// Prompts
console.log("Registering prompts...");
server.prompt(
  "monster-guide",
  { monster: z.string() },
  ({ monster }: { monster: string }) => {
    console.log(`Prompt 'monster-guide' called for monster: ${monster}`);
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `
I need help hunting ${monster}. Can you:
1. Tell me its weaknesses and resistances
2. Recommend what elements/weapons to use
3. List important items to bring
4. Describe key mechanics or behaviors to watch for
5. Suggest armor skills that would be helpful
          `.trim()
        }
      }]
    };
  }
);
registeredItems.prompts.push("monster-guide");
console.log("Registered prompt: monster-guide");

server.prompt(
  "farming-guide",
  { item: z.string() },
  ({ item }: { item: string }) => {
    console.log(`Prompt 'farming-guide' called for item: ${item}`);
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `
I need to farm ${item}. Can you:
1. Tell me which monsters/locations drop it
2. List the drop rates and conditions
3. Suggest the most efficient farming method
4. Recommend any skills or items that increase drop rates
5. Provide any relevant tips or tricks
          `.trim()
        }
      }]
    };
  }
);
registeredItems.prompts.push("farming-guide");
console.log("Registered prompt: farming-guide");

server.prompt(
  "build-planner",
  { 
    weapon: z.string(),
    playstyle: z.string()
  },
  ({ weapon, playstyle }: { weapon: string; playstyle: string }) => {
    console.log(`Prompt 'build-planner' called for weapon: ${weapon}, playstyle: ${playstyle}`);
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `
Help me create a ${playstyle} build for ${weapon}. Consider:
1. Key skills needed for the weapon type
2. Skills that complement the playstyle
3. Recommended armor pieces to get those skills
4. Decoration slots needed
5. Alternative options for flexibility
          `.trim()
        }
      }]
    };
  }
);
registeredItems.prompts.push("build-planner");
console.log("Registered prompt: build-planner");

// Start the server
const main = async () => {
  console.log("Starting MHW MCP Server with StdioTransport...");
  const transport = new StdioServerTransport();
  try {
    console.log("Attempting server.connect(transport)...");
    await server.connect(transport);
    console.log("MHW MCP Server connected and listening via stdio.");
    console.log(`
=========================================
MHW MCP Server (stdio) Ready
=========================================
- Server name: ${serverConfig.name}
- Server version: ${serverConfig.version}
- Transport: Stdio
- Available resources: ${registeredItems.resources.join(", ")}
- Available tools: ${registeredItems.tools.join(", ")}
- Available prompts: ${registeredItems.prompts.join(", ")}
=========================================
    `);
    console.log("Entering keep-alive promise loop...");
    // Keep the process alive indefinitely for stdio transport
    await new Promise<void>((resolve, reject) => {
      // This promise should never resolve or reject, keeping the process alive.
      console.log("Process is now being kept alive by an unresolved promise.");
    });
    console.log("This line (after keep-alive) should ideally not be reached."); // For debugging
  } catch (error) {
    console.error("Failed to connect MHW MCP Server OR error during keep-alive:", error);
    process.exit(1); // Exit if connection fails
  }
};

main().catch(error => {
  console.error("Unhandled error in main function execution:", error);
  process.exit(1);
});
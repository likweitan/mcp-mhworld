# Monster Hunter World MCP Server

This project provides an MCP server that connects to the Monster Hunter World Database API to help players access game information and get guidance for various gameplay aspects.

## Features

### Resources

1. Monster Data (`monster://{id}`)

   - Detailed monster information
   - Weaknesses and resistances
   - Location data
   - Drop tables

2. Armor Set Data (`armor-set://{id}`)
   - Complete armor set information
   - Set bonus details
   - Individual piece stats
   - Crafting requirements

### Tools

1. `find-monster`
   - Search monsters by name
   - Returns detailed information including:
     - Type and species
     - Locations where found
     - Element weaknesses
     - Complete description

```typescript
const result = await client.callTool({
  name: "find-monster",
  arguments: {
    name: "Rathalos",
  },
});
```

2. `find-weapon-path`
   - Search weapons by name
   - Shows complete crafting tree including:
     - Required materials
     - Upgrade paths
     - Material sources
     - Quantity needed

```typescript
const result = await client.callTool({
  name: "find-weapon-path",
  arguments: {
    name: "Iron Katana",
  },
});
```

3. `find-armor-by-skill`
   - Search armor pieces by skill name
   - Returns matching pieces with:
     - Defense values
     - Skill levels
     - Crafting requirements
     - Additional skills

```typescript
const result = await client.callTool({
  name: "find-armor-by-skill",
  arguments: {
    skill: "Attack Boost",
  },
});
```

### Prompts

1. `monster-guide`
   - Get comprehensive hunting guides
   - Includes:
     - Weakness exploitation
     - Weapon recommendations
     - Required items
     - Key mechanics
     - Recommended skills

```typescript
const guide = await client.getPrompt({
  name: "monster-guide",
  arguments: {
    monster: "Nergigante",
  },
});
```

2. `farming-guide`
   - Get efficient farming strategies
   - Covers:
     - Drop locations
     - Drop rates
     - Farming methods
     - Required skills
     - Helpful tips

```typescript
const guide = await client.getPrompt({
  name: "farming-guide",
  arguments: {
    item: "Wyvern Gem",
  },
});
```

3. `build-planner`
   - Get build recommendations
   - Includes:
     - Key skills for weapon type
     - Playstyle optimization
     - Armor suggestions
     - Decoration planning
     - Build variations

```typescript
const plan = await client.getPrompt({
  name: "build-planner",
  arguments: {
    weapon: "Long Sword",
    playstyle: "Critical Draw",
  },
});
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the project:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

4. Run the test client:

```bash
npm test
```

## Using in Your Application

1. Connect to the server:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/mhw-mcp-server.js"],
});

const client = new Client({
  name: "your-app",
  version: "1.0.0",
});

await client.connect(transport);
```

2. Use resources, tools and prompts as shown in the examples above.

## Example Use Cases

1. Equipment Planning

   - Search for armor with specific skills
   - Find complete weapon upgrade paths
   - Plan material farming routes
   - Optimize builds for different playstyles

2. Monster Hunting

   - Get detailed monster information
   - Learn weaknesses and resistances
   - Find optimal hunting locations
   - Prepare appropriate equipment

3. Material Farming
   - Find best sources for materials
   - Learn efficient farming methods
   - Optimize drop rates
   - Plan farming routes

## Data Sources

This server uses the [MHW-DB API](https://docs.mhw-db.com/) as its data source, providing access to:

- Complete monster database
- All equipment data
- Item information
- Location details
- Game mechanics data

The server implements caching to improve performance and reduce API calls.

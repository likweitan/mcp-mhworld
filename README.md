# Monster Hunter World Helper MCP Server

An MCP (Model Context Protocol) server that provides tools and resources for accessing Monster Hunter World game data via the [MHW DB API](https://docs.mhw-db.com/).

## Features

### Resources

- `monster://{id}` - Get detailed information about a specific monster
- `armor-set://{id}` - Get detailed information about a specific armor set

### Tools

- `find-monster` - Search for monsters by name and get their details including weaknesses, locations, and species
- `find-weapon-path` - Get the complete crafting tree path for a weapon, including all required materials
- `find-armor-by-skill` - Search for armor pieces that have specific skills

### Prompts

- `monster-guide` - Get comprehensive hunting guides for specific monsters
- `farming-guide` - Get efficient farming strategies for specific items
- `build-planner` - Get build recommendations based on weapon type and playstyle

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm run dev
```

The server will start in stdio mode and connect to Roo automatically if the `.roo/mcp.json` configuration is present.

## Usage Examples

### Finding Monster Information

```typescript
// Example tool usage through Roo
const result = await tool.use("find-monster", { name: "Rathalos" });
```

Response will include:

- Monster name and type
- Species information
- Locations where it can be found
- Element/status weaknesses
- Description

### Getting Weapon Crafting Path

```typescript
// Example tool usage through Roo
const result = await tool.use("find-weapon-path", {
  name: "Defender Greatsword",
});
```

Response will include:

- Complete upgrade path
- Required materials for each step
- Material sources/descriptions

### Finding Armor by Skill

```typescript
// Example tool usage through Roo
const result = await tool.use("find-armor-by-skill", { skill: "Attack Boost" });
```

Response will include:

- List of matching armor pieces
- Armor stats and rarity
- Skill levels
- Crafting requirements

### Getting a Monster Hunting Guide

```typescript
// Example prompt usage through Roo
const result = await prompt.use("monster-guide", { monster: "Nergigante" });
```

Response will provide:

1. Weaknesses and resistances
2. Recommended weapons/elements
3. Important items to bring
4. Key mechanics to watch for
5. Recommended armor skills

## API Details

### Resource Endpoints

#### Monster Resource (`monster://{id}`)

Returns detailed monster information from the MHW DB API.

#### Armor Set Resource (`armor-set://{id}`)

Returns detailed armor set information from the MHW DB API.

### Tool Parameters

#### find-monster

- `name` (string): Full or partial monster name to search for

#### find-weapon-path

- `name` (string): Full or partial weapon name to search for

#### find-armor-by-skill

- `skill` (string): Full or partial skill name to search for

### Prompt Parameters

#### monster-guide

- `monster` (string): Name of the monster to get a guide for

#### farming-guide

- `item` (string): Name of the item to get farming strategies for

#### build-planner

- `weapon` (string): Type of weapon for the build
- `playstyle` (string): Desired playstyle (e.g., "defensive", "DPS", etc.)

## Error Handling

The server includes comprehensive error handling and logging:

- API connection errors
- Resource not found errors
- Invalid parameter errors

All errors are properly logged to the console with detailed information to help with debugging.

## Development

The server is built with TypeScript and uses:

- Model Context Protocol (MCP) SDK
- Zod for parameter validation
- Fetch API for MHW DB API requests
- In-memory caching for API responses

To modify or extend the server:

1. Make changes to `mhw-mcp-server.ts`
2. The server will automatically reload when using `npm run dev`

## Contributing

Contributions are welcome! Please feel free to submit pull requests with new features, fixes, or improvements.

## License

MIT License - feel free to use this project as you wish.

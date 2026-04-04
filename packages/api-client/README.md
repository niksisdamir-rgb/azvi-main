# @azvirt/api-client

Type-safe tRPC client SDK for the AzVirt DMS. This package allows any consumer (React apps, Node scripts, CLI tools) to interact with the DMS API with full TypeScript autocomplete.

## Features

- 🛡️ **Full Type Safety**: Inherits types directly from the server routers.
- ⚛️ **React Ready**: Integrated hooks and provider using TanStack Query v5.
- 🍦 **Vanilla Support**: Works in any JS environment (Node, Deno, plain scripts).
- 🧬 **SuperJSON**: Automatic handling of Dates, Sets, and Maps over the wire.

## Installation

```bash
npm install @azvirt/api-client
# or
pnpm add @azvirt/api-client
```

## Usage

### In React Applications

Wrap your application with the provider:

```tsx
import { ApiProvider } from "@azvirt/api-client/react";

function Root() {
  return (
    <ApiProvider baseUrl="https://dms.azvirt.com">
      <App />
    </ApiProvider>
  );
}
```

Then use the hooks in your components:

```tsx
import { useApi } from "@azvirt/api-client/react";

function Materials() {
  const { data, isLoading } = useApi().materials.list.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.map(m => <li key={m.id}>{m.name}</li>)}
    </ul>
  );
}
```

### In Node.js or Vanilla JS

For scripts or server-to-server communication:

```ts
import { createVanillaClient } from "@azvirt/api-client";

const api = createVanillaClient({
  baseUrl: "http://localhost:3000",
  bearerToken: "your_api_token" // Optional
});

const materials = await api.materials.list.query();
console.log(materials);
```

## API Reference

The client mirrors the server routers. For a full list of available procedures, see the main [API_REFERENCE.md](../../API_REFERENCE.md).

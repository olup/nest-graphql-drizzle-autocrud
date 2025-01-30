# nest-graphql-drizzle-autocrud

Automatic CRUD operations for NestJS GraphQL using Drizzle ORM.

## Installation

Using pnpm (recommended):
```bash
pnpm add nest-graphql-drizzle-autocrud
```

Using npm:
```bash
npm install nest-graphql-drizzle-autocrud
```

Using yarn:
```bash
yarn add nest-graphql-drizzle-autocrud
```

## Requirements

This package has the following peer dependencies:
- `@nestjs/common`: ^10.0.0
- `@nestjs/core`: ^10.0.0
- `drizzle-orm`: ^0.28.0
- `reflect-metadata`: ^0.1.13

## Usage

```typescript
import { add } from 'nest-graphql-drizzle-autocrud';

// Example usage
const result = add(2, 3); // returns 5
```

## Development

### Setup
```bash
# Install dependencies
pnpm install
```

### Available Scripts

```bash
# Build the package
pnpm build

# Run tests
pnpm test

# Lint the code
pnpm lint

# Format the code
pnpm format
```

### Versioning

This package follows [Semantic Versioning](https://semver.org/). To update the version:

```bash
# Patch version for backwards-compatible bug fixes
pnpm version patch  # 1.0.0 -> 1.0.1

# Minor version for backwards-compatible features
pnpm version minor  # 1.0.0 -> 1.1.0

# Major version for breaking changes
pnpm version major  # 1.0.0 -> 2.0.0

# Set specific version
pnpm version 1.2.3
```

After versioning, push your changes and tags:
```bash
git push --follow-tags
```

### Publishing

The package is automatically published to npm when a new version tag is pushed. The process is handled by GitHub Actions:

1. Create and push a new version tag:
   ```bash
   pnpm version <version-type>
   git push --follow-tags
   ```
2. The GitHub Action will automatically:
   - Run tests
   - Build the package
   - Publish to npm

## License

MIT

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
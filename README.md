# NestJS GraphQL Drizzle AutoCRUD

Automatically generate GraphQL CRUD resolvers from your Drizzle schema.

## Installation

```bash
npm install nest-graphql-drizzle-autocrud
```

## Usage

1. First, set up your Drizzle client:

```typescript
// drizzle/client.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres('postgres://user:pass@host:port/db');
export const db = drizzle(client);
```

2. Create your schema:

```typescript
// drizzle/schema.ts
import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
});
```

3. Import DrizzleModule and AutoCrudModule in your app module:

```typescript
import { Module } from '@nestjs/common';
import { DrizzleModule } from 'nest-graphql-drizzle-autocrud';
import { AutoCrudModule } from 'nest-graphql-drizzle-autocrud';
import { db } from './drizzle/client';
import { users } from './drizzle/schema';

@Module({
  imports: [
    DrizzleModule.forRoot({
      client: db,
    }),
    AutoCrudModule.forRoot({
      schema: {
        users,
      },
    }),
  ],
})
export class AppModule {}
```

4. Create a resolver:

```typescript
import { AutoCrudResolver } from 'nest-graphql-drizzle-autocrud';
import { users } from './drizzle/schema';

@AutoCrudResolver({
  schema: users,
})
export class UsersResolver {}
```

Now you have the following GraphQL queries and mutations automatically generated:

```graphql
type User {
  id: Int!
  name: String!
  email: String!
}

type Query {
  getUser(id: Int!): User
  getUsers(where: UserWhereInput): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: Int!, input: UpdateUserInput!): User
  deleteUser(id: Int!): User
}
```

## Custom Resolvers

You can customize the auto-generated resolvers by using the `@WrapResolver` decorator:

```typescript
@AutoCrudResolver({
  schema: users,
})
export class UsersResolver {
  @WrapResolver('getOne')
  async beforeGetUser(id: number) {
    // Custom logic before getting a user
    console.log(`Getting user ${id}`);
    return id;
  }

  @WrapResolver('createOne')
  async afterCreateUser(input: any) {
    // Custom logic after creating a user
    await sendWelcomeEmail(input.email);
    return input;
  }
}
```

## Configuration

The DrizzleModule and AutoCrudModule can be configured with various options:

```typescript
DrizzleModule.forRoot({
  client: db, // Your drizzle client instance
})

AutoCrudModule.forRoot({
  schema: {
    users, // Your drizzle schema tables
    posts,
    comments,
  },
})
```

## License

MIT

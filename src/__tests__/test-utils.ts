import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { vi } from "vitest";

// Define mock types for better type safety
type MockUser = {
  id: number;
  name: string;
  email: string;
};

interface MockResolver {
  getOne(id: number): Promise<MockUser>;
  getMany(): Promise<MockUser[]>;
  createOne(data: Partial<MockUser>): Promise<MockUser>;
  updateOne(id: number, data: Partial<MockUser>): Promise<MockUser>;
  deleteOne(id: number): Promise<MockUser>;
}

import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";

// Mock table with proper Drizzle schema configuration
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  email: text("email"),
});

// Import Resolver decorator
import { Resolver } from "@nestjs/graphql";

@Resolver()
export class UserResolver implements MockResolver {
  static objectType: any;

  // CRUD methods with proper types defined as prototype methods
  async getOne(id: number): Promise<MockUser> {
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    };
  }

  async getMany(): Promise<MockUser[]> {
    return [
      {
        id: 1,
        name: "Test User",
        email: "test@example.com",
      },
    ];
  }

  async createOne(data: Partial<MockUser>): Promise<MockUser> {
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    };
  }

  async updateOne(id: number, data: Partial<MockUser>): Promise<MockUser> {
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    };
  }

  async deleteOne(id: number): Promise<MockUser> {
    return {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    };
  }
}

// Mock database with proper typing
type MockDatabase = {
  query: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
} & PostgresJsDatabase;

// Create mock database instance
export const mockDrizzle = {
  query: vi.fn(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    },
  ]),
  execute: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "Test User",
      email: "test@example.com",
    },
  ]),
} as unknown as MockDatabase;

// Mock discovery service
export class MockDiscoveryService {
  getProviders() {
    const instance = new UserResolver();
    const prototype = Object.getPrototypeOf(instance);

    // Mock the methods with spies while preserving prototype methods
    vi.spyOn(instance, "getOne");
    vi.spyOn(instance, "getMany");
    vi.spyOn(instance, "createOne");
    vi.spyOn(instance, "updateOne");
    vi.spyOn(instance, "deleteOne");

    return [
      {
        metatype: UserResolver,
        instance,
        prototype,
        token: UserResolver,
        scope: undefined,
        isNotMetatype: false,
      },
    ];
  }
}

// Mock reflector
export class MockReflector {
  private metadata: Map<any, any> = new Map();

  set(key: string, value: any, target: any) {
    // For class-level metadata
    if (target.name) {
      this.metadata.set(`${key}_${target.name}`, value);
    }
    // For method-level metadata
    else {
      // For vitest spy/mock functions, we need to use a different key format
      const fnKey = typeof target === "function" ? target.toString() : target;
      this.metadata.set(`${key}_${fnKey}`, value);
    }
  }

  get(key: string, target: any) {
    // For class-level metadata
    if (target.name) {
      return this.metadata.get(`${key}_${target.name}`);
    }
    // For method-level metadata
    const fnKey = typeof target === "function" ? target.toString() : target;
    return this.metadata.get(`${key}_${fnKey}`);
  }
}

// Mock metadata scanner
export class MockMetadataScanner {
  getAllMethodNames() {
    return ["getOne", "getMany", "createOne", "updateOne", "deleteOne"];
  }
}

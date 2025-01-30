import { Test } from "@nestjs/testing";
import { DrizzleModule } from "../drizzle.module";
import { DRIZZLE_ORM_INJECTION_KEY } from "../constant";
import { mockDrizzle } from "./test-utils";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, it, expect, beforeEach } from "vitest";

describe("DrizzleModule", () => {
  let drizzleClient: PostgresJsDatabase;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        DrizzleModule.forRoot({
          client: mockDrizzle,
        }),
      ],
    }).compile();

    drizzleClient = moduleRef.get<PostgresJsDatabase>(
      DRIZZLE_ORM_INJECTION_KEY
    );
  });

  it("should provide the drizzle client", () => {
    expect(drizzleClient).toBeDefined();
    expect(drizzleClient).toBe(mockDrizzle);
  });

  it("should have mock methods available", () => {
    expect(drizzleClient.select).toBeDefined();
    expect(drizzleClient.insert).toBeDefined();
    expect(drizzleClient.update).toBeDefined();
    expect(drizzleClient.delete).toBeDefined();
  });
});

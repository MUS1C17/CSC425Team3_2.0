import request from "supertest";
import { createTestServer } from "./utils/testServer";

// Simulate Supabase client behavior for route handlers
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => ({
    auth: {
      signInWithPassword: jest.fn(async ({ email, password }) => {
        if (email === "user@example.com" && password === "correct") {
          return { data: { user: { id: "uid123", email } }, error: null };
        }
        return {
          data: { user: null },
          error: { message: "Invalid login credentials" },
        };
      }),

      signUp: jest.fn(async ({ email, password }) => {
        if (!email || !password) {
          return { data: { user: null }, error: { message: "Missing fields" } };
        }
        if (email === "exists@example.com") {
          return {
            data: { user: null },
            error: { message: "User already registered" },
          };
        }
        return { data: { user: { id: "uid999", email } }, error: null };
      }),

      signOut: jest.fn(async () => ({ data: {}, error: null })),
      getClaims: jest.fn(async () => ({
        data: { claims: { email: "user@example.com" } },
      })),
    },
  })),
}));

describe("Authentication API Routes", () => {
  const app = createTestServer();

  beforeAll(
    () =>
      new Promise<void>((resolve) => {
        app.listen(() => resolve());
      }),
  );

  afterAll(
    () =>
      new Promise<void>((resolve, reject) => {
        app.close((err?: Error) => (err ? reject(err) : resolve()));
      }),
  );

  it("registers a new user successfully", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .set("Content-Type", "application/json")
      .send({ email: "new@example.com", password: "secret" });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: "uid999", email: "new@example.com" });
  });

  it("returns 400 when trying to register an existing user", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .set("Content-Type", "application/json")
      .send({ email: "exists@example.com", password: "secret" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/already/i);
  });

  it("logs in with valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send({ email: "user@example.com", password: "correct" });

    expect(response.status).toBe(200);
    expect(response.body.user).toEqual({ id: "uid123", email: "user@example.com" });
  });

  it("fails login with invalid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send({ email: "user@example.com", password: "wrong" });

    expect(response.status).toBe(401);
    expect(response.body.error).toMatch(/invalid/i);
  });

  it("logs out successfully", async () => {
    const response = await request(app).post("/api/auth/logout");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });
});

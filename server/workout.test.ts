import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the database module
vi.mock("./db", () => ({
  createCustomExercise: vi.fn(),
  getCustomExercisesByUser: vi.fn(),
  createSetLog: vi.fn(),
  getSetLogsByUser: vi.fn(),
  deleteSetLog: vi.fn(),
  updateSetLog: vi.fn(),
  createMeasurement: vi.fn(),
  getMeasurementsByUser: vi.fn(),
  deleteMeasurement: vi.fn(),
  updateMeasurement: vi.fn(),
  findOrCreateSession: vi.fn(),
}));

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("workout.addCustomExercise", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a custom exercise for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.createCustomExercise).mockResolvedValue(undefined as any);

    const result = await caller.workout.addCustomExercise({
      name: "Cable Flys",
      category: "Chest",
    });

    expect(result).toEqual({ success: true });
    expect(db.createCustomExercise).toHaveBeenCalledWith({
      userId: 1,
      name: "Cable Flys",
      category: "Chest",
    });
  });

  it("isolates exercises by user", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    vi.mocked(db.createCustomExercise).mockResolvedValue(undefined as any);

    await caller1.workout.addCustomExercise({
      name: "Exercise A",
      category: "Chest",
    });

    await caller2.workout.addCustomExercise({
      name: "Exercise B",
      category: "Back",
    });

    expect(db.createCustomExercise).toHaveBeenNthCalledWith(1, {
      userId: 1,
      name: "Exercise A",
      category: "Chest",
    });

    expect(db.createCustomExercise).toHaveBeenNthCalledWith(2, {
      userId: 2,
      name: "Exercise B",
      category: "Back",
    });
  });
});

describe("workout.getCustomExercises", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves custom exercises for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockExercises = [
      { id: 1, userId: 1, name: "Cable Flys", category: "Chest", createdAt: new Date() },
      { id: 2, userId: 1, name: "Face Pulls", category: "Shoulders", createdAt: new Date() },
    ];

    vi.mocked(db.getCustomExercisesByUser).mockResolvedValue(mockExercises);

    const result = await caller.workout.getCustomExercises();

    expect(result).toEqual(mockExercises);
    expect(db.getCustomExercisesByUser).toHaveBeenCalledWith(1);
  });
});

describe("workout.logSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs a set with automatic session creation", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.findOrCreateSession).mockResolvedValue(10);
    vi.mocked(db.createSetLog).mockResolvedValue(undefined as any);

    const result = await caller.workout.logSet({
      date: "1/20/2026",
      exercise: "Bench Press",
      sets: 3,
      reps: 10,
      weight: 185,
      time: "02:30:00 PM",
    });

    expect(result).toEqual({ success: true });
    expect(db.findOrCreateSession).toHaveBeenCalledWith(1, "1/20/2026");
    expect(db.createSetLog).toHaveBeenCalledWith({
      sessionId: 10,
      userId: 1,
      exercise: "Bench Press",
      sets: 3,
      reps: 10,
      weight: 185,
      time: "02:30:00 PM",
    });
  });

  it("isolates set logs by user", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    vi.mocked(db.findOrCreateSession).mockResolvedValue(10);
    vi.mocked(db.createSetLog).mockResolvedValue(undefined as any);

    await caller1.workout.logSet({
      date: "1/20/2026",
      exercise: "Bench Press",
      sets: 3,
      reps: 10,
      weight: 185,
      time: "02:30:00 PM",
    });

    await caller2.workout.logSet({
      date: "1/20/2026",
      exercise: "Squats",
      sets: 4,
      reps: 8,
      weight: 225,
      time: "03:00:00 PM",
    });

    expect(db.findOrCreateSession).toHaveBeenNthCalledWith(1, 1, "1/20/2026");
    expect(db.findOrCreateSession).toHaveBeenNthCalledWith(2, 2, "1/20/2026");
  });
});

describe("workout.getSetLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves set logs with dates for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockLogs = [
      {
        id: 1,
        sessionId: 10,
        userId: 1,
        exercise: "Bench Press",
        sets: 3,
        reps: 10,
        weight: 185,
        time: "02:30:00 PM",
        createdAt: new Date(),
        date: "1/20/2026",
      },
    ];

    vi.mocked(db.getSetLogsByUser).mockResolvedValue(mockLogs);

    const result = await caller.workout.getSetLogs();

    expect(result).toEqual(mockLogs);
    expect(db.getSetLogsByUser).toHaveBeenCalledWith(1);
  });
});

describe("workout.deleteSetLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a set log for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.deleteSetLog).mockResolvedValue(undefined as any);

    const result = await caller.workout.deleteSetLog({ id: 5 });

    expect(result).toEqual({ success: true });
    expect(db.deleteSetLog).toHaveBeenCalledWith(5, 1);
  });
});

describe("workout.updateSetLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a set log for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.updateSetLog).mockResolvedValue(undefined as any);

    const result = await caller.workout.updateSetLog({
      id: 5,
      sets: 4,
      reps: 12,
      weight: 200,
    });

    expect(result).toEqual({ success: true });
    expect(db.updateSetLog).toHaveBeenCalledWith(5, 1, {
      sets: 4,
      reps: 12,
      weight: 200,
    });
  });
});

describe("workout.addMeasurement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a measurement for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.createMeasurement).mockResolvedValue(undefined as any);

    const result = await caller.workout.addMeasurement({
      date: "1/20/2026",
      weight: 180,
      chest: 42,
      waist: 32,
      arms: 15,
      thighs: 24,
    });

    expect(result).toEqual({ success: true });
    expect(db.createMeasurement).toHaveBeenCalledWith({
      userId: 1,
      date: "1/20/2026",
      weight: "180",
      chest: "42",
      waist: "32",
      arms: "15",
      thighs: "24",
    });
  });

  it("isolates measurements by user", async () => {
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    vi.mocked(db.createMeasurement).mockResolvedValue(undefined as any);

    await caller1.workout.addMeasurement({
      date: "1/20/2026",
      weight: 180,
      chest: 42,
      waist: 32,
      arms: 15,
      thighs: 24,
    });

    await caller2.workout.addMeasurement({
      date: "1/20/2026",
      weight: 200,
      chest: 44,
      waist: 34,
      arms: 16,
      thighs: 26,
    });

    expect(db.createMeasurement).toHaveBeenNthCalledWith(1, {
      userId: 1,
      date: "1/20/2026",
      weight: "180",
      chest: "42",
      waist: "32",
      arms: "15",
      thighs: "24",
    });

    expect(db.createMeasurement).toHaveBeenNthCalledWith(2, {
      userId: 2,
      date: "1/20/2026",
      weight: "200",
      chest: "44",
      waist: "34",
      arms: "16",
      thighs: "26",
    });
  });
});

describe("workout.getMeasurements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves measurements for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const mockMeasurements = [
      {
        id: 1,
        userId: 1,
        date: "1/20/2026",
        weight: 180,
        chest: 42,
        waist: 32,
        arms: 15,
        thighs: 24,
        createdAt: new Date(),
      },
    ];

    vi.mocked(db.getMeasurementsByUser).mockResolvedValue(mockMeasurements);

    const result = await caller.workout.getMeasurements();

    expect(result).toEqual(mockMeasurements);
    expect(db.getMeasurementsByUser).toHaveBeenCalledWith(1);
  });
});

describe("workout.deleteMeasurement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a measurement for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.deleteMeasurement).mockResolvedValue(undefined as any);

    const result = await caller.workout.deleteMeasurement({ id: 3 });

    expect(result).toEqual({ success: true });
    expect(db.deleteMeasurement).toHaveBeenCalledWith(3, 1);
  });
});

describe("workout.updateMeasurement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates a measurement for authenticated user", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    vi.mocked(db.updateMeasurement).mockResolvedValue(undefined as any);

    const result = await caller.workout.updateMeasurement({
      id: 3,
      weight: 185,
      chest: 43,
    });

    expect(result).toEqual({ success: true });
    expect(db.updateMeasurement).toHaveBeenCalledWith(3, 1, {
      weight: "185",
      chest: "43",
    });
  });
});

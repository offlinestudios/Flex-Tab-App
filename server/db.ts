import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  workoutSessions, InsertWorkoutSession,
  setLogs, InsertSetLog,
  measurements, InsertMeasurement,
  customExercises, InsertCustomExercise
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Workout Sessions
export async function createWorkoutSession(session: InsertWorkoutSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(workoutSessions).values(session);
  return result;
}

export async function getWorkoutSessionsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId));
}

export async function findOrCreateSession(userId: number, date: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Try to find existing session
  const existing = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date)))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0].id;
  }
  
  // Create new session
  const result: any = await db.insert(workoutSessions).values({ userId, date });
  return Number(result[0].insertId);
}

// Set Logs
export async function createSetLog(log: InsertSetLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(setLogs).values(log);
}

export async function getSetLogsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Join with workout_sessions to get the date for each set
  const results = await db
    .select({
      id: setLogs.id,
      sessionId: setLogs.sessionId,
      userId: setLogs.userId,
      exercise: setLogs.exercise,
      sets: setLogs.sets,
      reps: setLogs.reps,
      weight: setLogs.weight,
      time: setLogs.time,
      createdAt: setLogs.createdAt,
      date: workoutSessions.date,
    })
    .from(setLogs)
    .leftJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
    .where(eq(setLogs.userId, userId));
  
  return results;
}

export async function deleteSetLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(setLogs).where(and(eq(setLogs.id, id), eq(setLogs.userId, userId)));
}

export async function updateSetLog(id: number, userId: number, data: Partial<InsertSetLog>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(setLogs).set(data).where(and(eq(setLogs.id, id), eq(setLogs.userId, userId)));
}

// Measurements
export async function createMeasurement(measurement: InsertMeasurement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(measurements).values(measurement);
}

export async function getMeasurementsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(measurements).where(eq(measurements.userId, userId));
}

export async function deleteMeasurement(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.delete(measurements).where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
}

export async function updateMeasurement(id: number, userId: number, data: Partial<InsertMeasurement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(measurements).set(data).where(and(eq(measurements.id, id), eq(measurements.userId, userId)));
}

// Custom Exercises
export async function createCustomExercise(exercise: InsertCustomExercise) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(customExercises).values(exercise);
}

export async function getCustomExercisesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(customExercises).where(eq(customExercises.userId, userId));
}

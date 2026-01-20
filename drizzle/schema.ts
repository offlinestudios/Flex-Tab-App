import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workout sessions table - tracks each workout day
 */
export const workoutSessions = mysqlTable("workout_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 20 }).notNull(), // Format: "M/D/YYYY"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Set logs table - individual exercise sets within a workout
 */
export const setLogs = mysqlTable("set_logs", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  userId: int("userId").notNull(),
  exercise: text("exercise").notNull(),
  sets: int("sets").notNull(),
  reps: int("reps").notNull(),
  weight: int("weight").notNull(),
  time: varchar("time", { length: 20 }).notNull(), // Format: "HH:MM:SS AM/PM"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Body measurements table - tracks user body metrics over time
 */
export const measurements = mysqlTable("measurements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  weight: int("weight").notNull(),
  chest: int("chest").notNull(),
  waist: int("waist").notNull(),
  arms: int("arms").notNull(),
  thighs: int("thighs").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Custom exercises table - user-created exercises
 */
export const customExercises = mysqlTable("custom_exercises", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WorkoutSession = typeof workoutSessions.$inferSelect;
export type InsertWorkoutSession = typeof workoutSessions.$inferInsert;
export type SetLog = typeof setLogs.$inferSelect;
export type InsertSetLog = typeof setLogs.$inferInsert;
export type Measurement = typeof measurements.$inferSelect;
export type InsertMeasurement = typeof measurements.$inferInsert;
export type CustomExercise = typeof customExercises.$inferSelect;
export type InsertCustomExercise = typeof customExercises.$inferInsert;
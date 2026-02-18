import { decimal, integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// PostgreSQL enum for user roles
export const roleEnum = pgEnum("role", ["user", "admin"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Clerk user identifier. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Workout sessions table - tracks each workout day
 */
export const workoutSessions = pgTable("workout_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 20 }).notNull(), // Format: "M/D/YYYY"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Set logs table - individual exercise sets within a workout
 */
export const setLogs = pgTable("set_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("sessionId").notNull(),
  userId: integer("userId").notNull(),
  exercise: text("exercise").notNull(),
  sets: integer("sets").notNull(),
  reps: integer("reps").notNull(),
  weight: integer("weight").notNull(),
  time: varchar("time", { length: 20 }).notNull(), // Format: "HH:MM:SS AM/PM"
  // Cardio-specific fields
  category: text("category"), // Exercise category (e.g., "Cardio", "Chest", "Back")
  duration: integer("duration"), // Duration in minutes (for cardio)
  distance: decimal("distance", { precision: 6, scale: 2 }), // Distance (for cardio)
  distanceUnit: varchar("distanceUnit", { length: 10 }), // "miles" or "km"
  calories: integer("calories"), // Calories burned (for cardio)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Body measurements table - tracks user body metrics over time
 */
export const measurements = pgTable("measurements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  date: varchar("date", { length: 20 }).notNull(),
  weight: decimal("weight", { precision: 5, scale: 1 }).notNull(),
  chest: decimal("chest", { precision: 5, scale: 1 }).notNull(),
  waist: decimal("waist", { precision: 5, scale: 1 }).notNull(),
  arms: decimal("arms", { precision: 5, scale: 1 }).notNull(),
  thighs: decimal("thighs", { precision: 5, scale: 1 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Custom exercises table - user-created exercises
 */
export const customExercises = pgTable("custom_exercises", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
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

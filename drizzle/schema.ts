import { boolean, decimal, integer, pgEnum, pgTable, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";

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
  avatarUrl: text("avatarUrl"),
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
  durationSeconds: integer("durationSeconds"), // Total workout duration in seconds (nullable for legacy rows)
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

/**
 * Community posts table - user-created posts shared to the community feed
 */
export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  caption: text("caption"),
  // Optional link to a workout session for attaching workout log data
  workoutSessionId: integer("workoutSessionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

/**
 * Post media table - photos and videos attached to a post (stored in R2)
 */
export const postMedia = pgTable("post_media", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  r2Key: text("r2Key").notNull(),           // e.g. "posts/42/media/abc123.mp4"
  mediaType: varchar("mediaType", { length: 10 }).notNull(), // "photo" | "video"
  mimeType: varchar("mimeType", { length: 64 }).notNull(),   // e.g. "video/mp4"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Post likes table - one row per user-post like (unique constraint prevents double-likes)
 */
export const postLikes = pgTable("post_likes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Post comments table
 */
export const postComments = pgTable("post_comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("postId").notNull(),
  userId: integer("userId").notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;
export type PostMedia = typeof postMedia.$inferSelect;
export type PostLike = typeof postLikes.$inferSelect;
export type PostComment = typeof postComments.$inferSelect;

/**
 * Social graph — follows
 * One row per follower→followee relationship.
 * Unique constraint prevents duplicate follows.
 */
export const userFollows = pgTable(
  "user_follows",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    followerId: integer("followerId").notNull(),
    followeeId: integer("followeeId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [unique().on(t.followerId, t.followeeId)]
);

/**
 * Social graph — blocks
 * When user A blocks user B:
 *   - B's posts are hidden from A's feed
 *   - B cannot see A's profile or posts
 */
export const userBlocks = pgTable(
  "user_blocks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    blockerId: integer("blockerId").notNull(),
    blockedId: integer("blockedId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [unique().on(t.blockerId, t.blockedId)]
);

/**
 * Social graph — mutes
 * Muting hides a user's posts from your feed without notifying them.
 * The muted user can still see your content.
 */
export const userMutes = pgTable(
  "user_mutes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    muterId: integer("muterId").notNull(),
    mutedId: integer("mutedId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (t) => [unique().on(t.muterId, t.mutedId)]
);

export type UserFollow = typeof userFollows.$inferSelect;
export type UserBlock = typeof userBlocks.$inferSelect;
export type UserMute = typeof userMutes.$inferSelect;

/**
 * Notifications table
 * One row per notification event (follow, like, comment).
 * actorId = the user who triggered the event.
 * recipientId = the user who receives the notification.
 * entityId = the relevant post/comment ID (null for follow notifications).
 */
export const notifications = pgTable("notifications", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  recipientId: integer("recipientId").notNull(),
  actorId: integer("actorId").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // 'follow' | 'like' | 'comment'
  entityId: integer("entityId"),                   // postId for like/comment, null for follow
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSetLog,
  getSetLogsByUser,
  deleteSetLog,
  updateSetLog,
  createMeasurement,
  getMeasurementsByUser,
  deleteMeasurement,
  updateMeasurement,
  createCustomExercise,
  getCustomExercisesByUser,
  findOrCreateSession,
} from "../db";

export const workoutRouter = router({
  // Set Logs - with automatic session management
  logSet: protectedProcedure
    .input(
      z.object({
        date: z.string(), // Format: "M/D/YYYY"
        exercise: z.string(),
        sets: z.number().int().positive(),
        reps: z.number().int().positive(),
        weight: z.number().int().nonnegative(),
        time: z.string(), // Format: "HH:MM:SS AM/PM"
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Automatically find or create session for this date
      const sessionId = await findOrCreateSession(ctx.user.id, input.date);
      
      await createSetLog({
        sessionId,
        userId: ctx.user.id,
        exercise: input.exercise,
        sets: input.sets,
        reps: input.reps,
        weight: input.weight,
        time: input.time,
      });
      return { success: true };
    }),

  getSetLogs: protectedProcedure.query(async ({ ctx }) => {
    return await getSetLogsByUser(ctx.user.id);
  }),

  deleteSetLog: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await deleteSetLog(input.id, ctx.user.id);
      return { success: true };
    }),

  updateSetLog: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        sets: z.number().int().positive().optional(),
        reps: z.number().int().positive().optional(),
        weight: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateSetLog(id, ctx.user.id, data);
      return { success: true };
    }),

  // Measurements
  addMeasurement: protectedProcedure
    .input(
      z.object({
        date: z.string(), // Format: "M/D/YYYY"
        weight: z.number().int().nonnegative(),
        chest: z.number().int().nonnegative(),
        waist: z.number().int().nonnegative(),
        arms: z.number().int().nonnegative(),
        thighs: z.number().int().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createMeasurement({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getMeasurements: protectedProcedure.query(async ({ ctx }) => {
    return await getMeasurementsByUser(ctx.user.id);
  }),

  deleteMeasurement: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await deleteMeasurement(input.id, ctx.user.id);
      return { success: true };
    }),

  updateMeasurement: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        weight: z.number().int().nonnegative().optional(),
        chest: z.number().int().nonnegative().optional(),
        waist: z.number().int().nonnegative().optional(),
        arms: z.number().int().nonnegative().optional(),
        thighs: z.number().int().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await updateMeasurement(id, ctx.user.id, data);
      return { success: true };
    }),

  // Custom Exercises
  addCustomExercise: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        category: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createCustomExercise({
        userId: ctx.user.id,
        name: input.name,
        category: input.category,
      });
      return { success: true };
    }),

  getCustomExercises: protectedProcedure.query(async ({ ctx }) => {
    return await getCustomExercisesByUser(ctx.user.id);
  }),
});

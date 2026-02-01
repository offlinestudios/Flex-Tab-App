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
        weight: z.number().nonnegative(),
        chest: z.number().nonnegative(),
        waist: z.number().nonnegative(),
        arms: z.number().nonnegative(),
        thighs: z.number().nonnegative(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await createMeasurement({
        userId: ctx.user.id,
        date: input.date,
        weight: input.weight.toString(),
        chest: input.chest.toString(),
        waist: input.waist.toString(),
        arms: input.arms.toString(),
        thighs: input.thighs.toString(),
      });
      return { success: true };
    }),

  getMeasurements: protectedProcedure.query(async ({ ctx }) => {
    const measurements = await getMeasurementsByUser(ctx.user.id);
    // Convert decimal strings to numbers for frontend
    return measurements.map(m => ({
      ...m,
      weight: parseFloat(m.weight as any),
      chest: parseFloat(m.chest as any),
      waist: parseFloat(m.waist as any),
      arms: parseFloat(m.arms as any),
      thighs: parseFloat(m.thighs as any),
    }));
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
        weight: z.number().nonnegative().optional(),
        chest: z.number().nonnegative().optional(),
        waist: z.number().nonnegative().optional(),
        arms: z.number().nonnegative().optional(),
        thighs: z.number().nonnegative().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      // Convert numbers to strings for decimal database fields
      const convertedData: Record<string, string> = {};
      if (data.weight !== undefined) convertedData.weight = data.weight.toString();
      if (data.chest !== undefined) convertedData.chest = data.chest.toString();
      if (data.waist !== undefined) convertedData.waist = data.waist.toString();
      if (data.arms !== undefined) convertedData.arms = data.arms.toString();
      if (data.thighs !== undefined) convertedData.thighs = data.thighs.toString();
      await updateMeasurement(id, ctx.user.id, convertedData);
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

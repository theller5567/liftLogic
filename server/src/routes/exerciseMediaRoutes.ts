import { Router } from "express";
import { z } from "zod";

import {
  createUnavailableExerciseMediaResponse,
  getExerciseInstructionFallback,
  getExerciseMediaMetadata,
} from "../../../shared/utils/exerciseMedia";
import { getExerciseById } from "../../../shared/utils/exerciseLibraryAdapter";
import {
  requireClientIdentity,
} from "../middleware/clientIdentity";
import { fetchYMoveExerciseMedia } from "../services/ymoveMedia";

const router = Router();
const exerciseIdSchema = z.string().min(1).max(120);

router.use(requireClientIdentity);

router.get("/:exerciseId", async (req, res, next) => {
  try {
    const exerciseId = exerciseIdSchema.parse(req.params.exerciseId);
    const exercise = getExerciseById(exerciseId);

    if (!exercise) {
      res.status(404).json({
        code: "EXERCISE_NOT_FOUND",
        error: "Exercise not found.",
      });
      return;
    }

    const media = getExerciseMediaMetadata(exerciseId);
    const instructions = getExerciseInstructionFallback(exerciseId);

    if (!media?.providerExerciseId) {
      res.json(createUnavailableExerciseMediaResponse(exerciseId, "not_mapped"));
      return;
    }

    const ymoveMedia = await fetchYMoveExerciseMedia({
      exerciseId,
      fallbackInstructions: instructions,
      fallbackTitle: exercise.displayName ?? exercise.name,
      media,
    });

    res.json(
      ymoveMedia.ok
        ? ymoveMedia.media
        : createUnavailableExerciseMediaResponse(
            exerciseId,
            "provider_error"
          )
    );
  } catch (error) {
    next(error);
  }
});

export default router;

import { z } from "zod";

export const saveAnswersSchema = z.object({
  answers: z
    .array(
      z.object({
        question_id: z.string().uuid(),
        option_ids: z.array(z.string().uuid()).optional(),
        value: z.string().optional(),
      }),
    )
    .min(1),
});

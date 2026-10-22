
-- Hard rules enforced by the database, not only by the application.
-- Anonymity threshold: eight or higher. The program lead may raise it, never lower it.
ALTER TABLE "OrgSettings" ADD CONSTRAINT "anonymity_threshold_floor" CHECK ("anonymityThreshold" >= 8);
-- Correction window: ninety days or longer.
ALTER TABLE "OrgSettings" ADD CONSTRAINT "correction_window_floor" CHECK ("correctionWindowDays" >= 90);
-- Exactly one settings row.
ALTER TABLE "OrgSettings" ADD CONSTRAINT "settings_singleton" CHECK ("id" = 1);
-- Survey answers: eight statements on a one to five scale.
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "answers_shape" CHECK (array_length("answers", 1) = 8 AND 1 <= ALL("answers") AND 5 >= ALL("answers"));
ALTER TABLE "LeaderSelfRating" ADD CONSTRAINT "self_answers_shape" CHECK (array_length("answers", 1) = 8 AND 1 <= ALL("answers") AND 5 >= ALL("answers"));


-- CreateEnum
CREATE TYPE "Role" AS ENUM ('program_lead', 'leader', 'respondent', 'senior_reviewer', 'board_reviewer');

-- CreateEnum
CREATE TYPE "Vantage" AS ENUM ('above', 'beside', 'below');

-- CreateEnum
CREATE TYPE "FindingState" AS ENUM ('PRIVATE_SURFACING', 'CORRECTION_WINDOW', 'DOCUMENTED_RECORD', 'SENIOR_REVIEW', 'BOARD_REVIEW', 'RESOLVED');

-- CreateEnum
CREATE TYPE "ResponseKind" AS ENUM ('context', 'contest', 'plan');

-- CreateEnum
CREATE TYPE "DecisionOutcome" AS ENUM ('accepted', 'dismissed', 'deferred', 'approved', 'declined');

-- CreateEnum
CREATE TYPE "CommitmentType" AS ENUM ('promotion', 'development', 'culture', 'other');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('draft', 'open', 'closed');

-- CreateEnum
CREATE TYPE "ProposalKind" AS ENUM ('advance', 'resolve');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "roles" "Role"[] DEFAULT ARRAY['respondent']::"Role"[],
    "personId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "OrgSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "organizationName" TEXT NOT NULL DEFAULT 'Your organization',
    "anonymityThreshold" INTEGER NOT NULL DEFAULT 8,
    "correctionWindowDays" INTEGER NOT NULL DEFAULT 90,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "aiKeyCiphertext" TEXT,
    "reportingChannels" TEXT NOT NULL DEFAULT '',
    "ceoReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "checklistDone" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "reads" TEXT NOT NULL,
    "neverReads" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoticeAcknowledgment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeAcknowledgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "anonId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "roleTitle" TEXT NOT NULL,
    "jobLevel" TEXT,
    "managerId" TEXT,
    "isChiefExecutive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedById" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionRecord" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL,
    "requestedAt" TIMESTAMP(3),
    "affectedRole" TEXT NOT NULL,
    "documentedReason" TEXT NOT NULL,
    "alternativesConsidered" TEXT NOT NULL,
    "outcome" "DecisionOutcome",
    "shift" TEXT,
    "team" TEXT,
    "tenureBand" TEXT,
    "minutesBeforeOpinion" INTEGER,
    "importBatchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRecord" (
    "id" TEXT NOT NULL,
    "subjectRef" TEXT NOT NULL,
    "candidateRole" TEXT NOT NULL,
    "approvalDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "importBatchId" TEXT NOT NULL,

    CONSTRAINT "PromotionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "subjectRef" TEXT NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "commitmentText" TEXT,
    "commitmentType" "CommitmentType",
    "commitmentDue" TIMESTAMP(3),
    "surveyItem" INTEGER,
    "importBatchId" TEXT NOT NULL,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StretchAssignment" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "recipientRole" TEXT NOT NULL,
    "recipientRef" TEXT,
    "tenureBand" TEXT NOT NULL,
    "resultRating" DOUBLE PRECISION,
    "importBatchId" TEXT NOT NULL,

    CONSTRAINT "StretchAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Complaint" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "filedAt" TIMESTAMP(3) NOT NULL,
    "filerRole" TEXT NOT NULL,
    "filerRef" TEXT NOT NULL,
    "filerPersonId" TEXT,
    "text" TEXT NOT NULL,
    "excluded" BOOLEAN NOT NULL DEFAULT false,
    "importBatchId" TEXT NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplaintComparison" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "firstViewedAt" TIMESTAMP(3),
    "filerContext" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintComparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyCycle" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'draft',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SurveyCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyInvitation" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SurveyInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "vantage" "Vantage" NOT NULL,
    "jobLevel" TEXT,
    "answers" INTEGER[],
    "comments" TEXT[],
    "openAnswer" TEXT,

    CONSTRAINT "SurveyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderSelfRating" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "answers" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderSelfRating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaderPersonId" TEXT NOT NULL,
    "waitUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,
    "patternKey" TEXT NOT NULL,
    "cycleId" TEXT,
    "metrics" JSONB NOT NULL,
    "report" TEXT NOT NULL,
    "state" "FindingState" NOT NULL DEFAULT 'PRIVATE_SURFACING',
    "resolvedFromState" "FindingState",
    "deliveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "firstOpenedAt" TIMESTAMP(3),
    "windowEndsAt" TIMESTAMP(3),
    "contested" BOOLEAN NOT NULL DEFAULT false,
    "contestReadById" TEXT,
    "contestReadAt" TIMESTAMP(3),
    "proposal" "ProposalKind",
    "proposalAt" TIMESTAMP(3),
    "patternPersists" BOOLEAN,
    "persistenceMetrics" JSONB,
    "persistenceAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderResponse" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "kind" "ResponseKind" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaderResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Judgment" (
    "id" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "stage" "FindingState" NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Judgment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewerAssignment" (
    "id" TEXT NOT NULL,
    "leaderPersonId" TEXT NOT NULL,
    "seniorReviewerUserId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GateEvent" (
    "id" TEXT NOT NULL,
    "firedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordIds" TEXT[],

    CONSTRAINT "GateEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorKind" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "reason" TEXT,
    "meta" JSONB,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_personId_key" ON "User"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Notice_version_key" ON "Notice"("version");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeAcknowledgment_userId_noticeId_key" ON "NoticeAcknowledgment"("userId", "noticeId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_externalId_key" ON "Person"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "Person_anonId_key" ON "Person"("anonId");

-- CreateIndex
CREATE INDEX "DecisionRecord_leaderId_idx" ON "DecisionRecord"("leaderId");

-- CreateIndex
CREATE INDEX "PromotionRecord_subjectRef_idx" ON "PromotionRecord"("subjectRef");

-- CreateIndex
CREATE INDEX "Evaluation_leaderId_idx" ON "Evaluation"("leaderId");

-- CreateIndex
CREATE INDEX "Evaluation_subjectRef_idx" ON "Evaluation"("subjectRef");

-- CreateIndex
CREATE INDEX "StretchAssignment_leaderId_idx" ON "StretchAssignment"("leaderId");

-- CreateIndex
CREATE INDEX "Complaint_leaderId_idx" ON "Complaint"("leaderId");

-- CreateIndex
CREATE INDEX "Complaint_filerRef_idx" ON "Complaint"("filerRef");

-- CreateIndex
CREATE UNIQUE INDEX "ComplaintComparison_complaintId_key" ON "ComplaintComparison"("complaintId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyCycle_number_key" ON "SurveyCycle"("number");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyInvitation_cycleId_leaderId_userId_key" ON "SurveyInvitation"("cycleId", "leaderId", "userId");

-- CreateIndex
CREATE INDEX "SurveyResponse_cycleId_leaderId_idx" ON "SurveyResponse"("cycleId", "leaderId");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderSelfRating_cycleId_leaderId_key" ON "LeaderSelfRating"("cycleId", "leaderId");

-- CreateIndex
CREATE INDEX "AvailabilityFlag_leaderPersonId_idx" ON "AvailabilityFlag"("leaderPersonId");

-- CreateIndex
CREATE INDEX "Finding_leaderId_idx" ON "Finding"("leaderId");

-- CreateIndex
CREATE INDEX "Finding_state_idx" ON "Finding"("state");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewerAssignment_leaderPersonId_key" ON "ReviewerAssignment"("leaderPersonId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeAcknowledgment" ADD CONSTRAINT "NoticeAcknowledgment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeAcknowledgment" ADD CONSTRAINT "NoticeAcknowledgment_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplaintComparison" ADD CONSTRAINT "ComplaintComparison_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyInvitation" ADD CONSTRAINT "SurveyInvitation_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SurveyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SurveyResponse" ADD CONSTRAINT "SurveyResponse_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SurveyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderSelfRating" ADD CONSTRAINT "LeaderSelfRating_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "SurveyCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaderResponse" ADD CONSTRAINT "LeaderResponse_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Judgment" ADD CONSTRAINT "Judgment_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "Finding"("id") ON DELETE CASCADE ON UPDATE CASCADE;


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

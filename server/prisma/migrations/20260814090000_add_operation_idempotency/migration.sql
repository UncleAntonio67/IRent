-- A persisted client operation id makes retrying a timed-out request safe.
ALTER TABLE "OperationLog" ADD COLUMN "clientOperationId" TEXT;

CREATE UNIQUE INDEX "OperationLog_clientOperationId_key"
  ON "OperationLog"("clientOperationId");

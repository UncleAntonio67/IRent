-- A client retry must not create a second attachment when the first upload
-- reached the server but the device lost the response.
ALTER TABLE "Attachment" ADD COLUMN "clientOperationId" TEXT;

CREATE UNIQUE INDEX "Attachment_clientOperationId_key"
  ON "Attachment"("clientOperationId");

CREATE TABLE "RoomArchive" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "originalRoomId" TEXT NOT NULL,
  "propertyName" TEXT NOT NULL,
  "blockName" TEXT NOT NULL,
  "floorNo" INTEGER NOT NULL,
  "roomNo" TEXT NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "snapshotJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoomArchive_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "RoomArchive"
  ADD CONSTRAINT "RoomArchive_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "RoomArchive_tenantId_deletedAt_idx" ON "RoomArchive"("tenantId", "deletedAt");
CREATE INDEX "RoomArchive_tenantId_roomNo_idx" ON "RoomArchive"("tenantId", "roomNo");
CREATE INDEX "RoomArchive_expiresAt_idx" ON "RoomArchive"("expiresAt");

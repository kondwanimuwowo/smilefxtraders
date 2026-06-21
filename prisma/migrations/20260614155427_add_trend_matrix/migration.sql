-- CreateTable
CREATE TABLE "trend_matrix" (
    "id" TEXT NOT NULL,
    "matrix" JSONB NOT NULL,
    "notes" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT,

    CONSTRAINT "trend_matrix_pkey" PRIMARY KEY ("id")
);

/*
  Warnings:

  - The `department` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('MANTENIMIENTO_ELECTRICO', 'PLOMERIA', 'SEGURIDAD', 'INFRAESTRUCTURA', 'REDES_Y_TELECOMUNICACIONES', 'ADMINISTRACION', 'OTROS');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "department" "Department" NOT NULL DEFAULT 'OTROS';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department",
ADD COLUMN     "department" "Department";

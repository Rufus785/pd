-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nickname" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "password_changed" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("id", "nickname", "password_hash") SELECT "id", "nickname", "password_hash" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

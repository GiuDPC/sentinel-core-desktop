-- CreateIndex
CREATE INDEX "audit_logs_ticket_id_idx" ON "audit_logs"("ticket_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_creator_id_idx" ON "tickets"("creator_id");

-- CreateIndex
CREATE INDEX "tickets_status_due_date_idx" ON "tickets"("status", "due_date");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at");

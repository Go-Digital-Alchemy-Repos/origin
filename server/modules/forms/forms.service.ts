import { db } from "../../db";
import { forms, formSubmissions } from "@shared/schema";
import type { Form, FormSubmission } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";

function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export const formsService = {
  async getFormsBySite(siteId: string, workspaceId: string): Promise<Form[]> {
    return db
      .select()
      .from(forms)
      .where(and(eq(forms.siteId, siteId), eq(forms.workspaceId, workspaceId)))
      .orderBy(desc(forms.createdAt));
  },

  async getForm(formId: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, formId));
    return form ?? undefined;
  },

  async getFormForWorkspace(formId: string, workspaceId: string): Promise<Form | undefined> {
    const [form] = await db
      .select()
      .from(forms)
      .where(and(eq(forms.id, formId), eq(forms.workspaceId, workspaceId)));
    return form ?? undefined;
  },

  async createForm(data: {
    name: string;
    siteId: string;
    workspaceId: string;
    fieldsJson?: unknown;
    settingsJson?: unknown;
  }): Promise<Form> {
    const [form] = await db
      .insert(forms)
      .values({
        name: data.name,
        siteId: data.siteId,
        workspaceId: data.workspaceId,
        fieldsJson: data.fieldsJson ?? [],
        settingsJson: data.settingsJson ?? {},
      })
      .returning();
    return form;
  },

  async updateForm(
    formId: string,
    data: {
      name?: string;
      fieldsJson?: unknown;
      settingsJson?: unknown;
      isActive?: boolean;
    },
  ): Promise<Form> {
    const updateFields: Record<string, unknown> = { updatedAt: new Date() };
    if (data.name !== undefined) updateFields.name = data.name;
    if (data.fieldsJson !== undefined) updateFields.fieldsJson = data.fieldsJson;
    if (data.settingsJson !== undefined) updateFields.settingsJson = data.settingsJson;
    if (data.isActive !== undefined) updateFields.isActive = data.isActive;

    const [form] = await db
      .update(forms)
      .set(updateFields)
      .where(eq(forms.id, formId))
      .returning();
    return form;
  },

  async deleteForm(formId: string): Promise<void> {
    await db.delete(forms).where(eq(forms.id, formId));
  },

  async submitForm(
    formId: string,
    payload: Record<string, unknown>,
    ip: string,
    userAgent: string,
  ): Promise<FormSubmission> {
    const [submission] = await db
      .insert(formSubmissions)
      .values({
        formId,
        payloadJson: payload,
        ipHash: hashIp(ip),
        userAgent: userAgent.slice(0, 500),
      })
      .returning();
    return submission;
  },

  async getSubmissions(
    formId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ submissions: FormSubmission[]; total: number }> {
    const [countResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId));

    const submissions = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.formId, formId))
      .orderBy(desc(formSubmissions.createdAt))
      .limit(limit)
      .offset(offset);

    return { submissions, total: countResult?.count ?? 0 };
  },

  async getSubmission(submissionId: string): Promise<FormSubmission | undefined> {
    const [sub] = await db
      .select()
      .from(formSubmissions)
      .where(eq(formSubmissions.id, submissionId));
    return sub ?? undefined;
  },

  async deleteSubmission(submissionId: string): Promise<void> {
    await db.delete(formSubmissions).where(eq(formSubmissions.id, submissionId));
  },

  async checkRateLimit(formId: string, ipHash: string, maxPerMinute: number): Promise<boolean> {
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(formSubmissions)
      .where(
        and(
          eq(formSubmissions.formId, formId),
          eq(formSubmissions.ipHash, ipHash),
          sql`${formSubmissions.createdAt} > ${oneMinuteAgo}`,
        ),
      );
    return (result?.count ?? 0) < maxPerMinute;
  },
};

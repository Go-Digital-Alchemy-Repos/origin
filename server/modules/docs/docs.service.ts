import { docsRepo } from "./docs.repo";
import { NotFoundError } from "../shared/errors";
import type { InsertDocEntry } from "@shared/schema";

class DocsService {
  async getAll() {
    return docsRepo.findAll();
  }

  async getBySlug(slug: string) {
    const doc = await docsRepo.findBySlug(slug);
    if (!doc) throw new NotFoundError("Doc entry");
    return doc;
  }

  async create(data: InsertDocEntry) {
    return docsRepo.create(data);
  }
}

export const docsService = new DocsService();

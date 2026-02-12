import { docsRepo } from "./docs.repo";
import { NotFoundError } from "../shared/errors";
import type { InsertDocEntry } from "@shared/schema";

class DocsService {
  async getAll() {
    return docsRepo.findAll();
  }

  async getByType(type: string) {
    return docsRepo.findByType(type);
  }

  async getByCategory(category: string) {
    return docsRepo.findByCategory(category);
  }

  async getBySlug(slug: string) {
    const doc = await docsRepo.findBySlug(slug);
    if (!doc) throw new NotFoundError("Doc entry");
    return doc;
  }

  async getById(id: string) {
    const doc = await docsRepo.findById(id);
    if (!doc) throw new NotFoundError("Doc entry");
    return doc;
  }

  async search(query: string) {
    return docsRepo.search(query);
  }

  async getPublishedHelp() {
    return docsRepo.findPublishedByType("help");
  }

  async getPublishedDeveloper() {
    return docsRepo.findPublishedByType("developer");
  }

  async create(data: InsertDocEntry) {
    return docsRepo.create(data);
  }

  async update(id: string, data: Partial<InsertDocEntry>) {
    const doc = await docsRepo.update(id, data);
    if (!doc) throw new NotFoundError("Doc entry");
    return doc;
  }

  async delete(id: string) {
    const doc = await docsRepo.delete(id);
    if (!doc) throw new NotFoundError("Doc entry");
    return doc;
  }
}

export const docsService = new DocsService();

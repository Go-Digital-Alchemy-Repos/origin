import { modulesRepo } from "./modules.repo";
import { NotFoundError } from "../shared/errors";

class ModulesService {
  async getAll() {
    return modulesRepo.findAll();
  }

  async getBySlug(slug: string) {
    const mod = await modulesRepo.findBySlug(slug);
    if (!mod) throw new NotFoundError("Module");
    return mod;
  }
}

export const modulesService = new ModulesService();

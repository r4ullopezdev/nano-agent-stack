import type { SkillDefinition, SkillResult } from "../types.js";

export class SkillRegistry {
  private readonly skills = new Map<string, SkillDefinition>();

  register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill);
  }

  registerMany(skills: SkillDefinition[]): void {
    skills.forEach((skill) => this.register(skill));
  }

  has(id: string): boolean {
    return this.skills.has(id);
  }

  list(): SkillDefinition[] {
    return [...this.skills.values()];
  }

  async invoke(id: string, task: string, context: Record<string, unknown>): Promise<SkillResult> {
    const skill = this.skills.get(id);
    if (!skill) {
      throw new Error(`Skill '${id}' is not registered.`);
    }
    return skill.handler({ task, context });
  }
}


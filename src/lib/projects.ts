import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

export type Project = {
  slug: string;
  title: string;
  description: string;
  image: string;
  logo: string;
  bg: string;
};

export function getProjects(): Project[] {
  const filePath = path.resolve("src/content/projects.yaml");
  const file = fs.readFileSync(filePath, "utf8");
  const data = parse(file);

  if (!Array.isArray(data)) {
    throw new Error("projects.yaml must be a YAML list (starting with '-')");
  }

  return data as Project[];
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

// TypeScript Interfaces for Portfolio Application
// Developer: Oleg G. (@Metarenessans)

export type ThemeMode = 'dark' | 'light';

export interface ApiRouteData {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  url: string;
  jsonOutput: string;
}

export interface ArchStep {
  step: string;
  title: string;
  description: string;
}

export interface CicdStage {
  step: string;
  status: string;
  name: string;
  desc: string;
  command: string;
}

export interface SkillCategory {
  title: string;
  skills: string[];
}

export interface ClientProject {
  id: string;
  label: string;
  tag: string;
  title: string;
  description: string;
  link: string;
}

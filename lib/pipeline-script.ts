export type PipelineStepId =
  | "idle"
  | "incident_detected"
  | "satellite_zoom"
  | "device_cloud"
  | "network_analysis"
  | "drone_deploy"
  | "ethics_wrapup";

export interface PipelineStep {
  id: PipelineStepId;
  title: string;
  description: string;
  durationMs: number;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: "idle",
    title: "Normal Pipeline Operations",
    description:
      "Pipelines operate normally; monitoring systems track pressure, flow, and leaks over long distances.",
    durationMs: 20000,
  },
  {
    id: "incident_detected",
    title: "Incident Detected",
    description:
      "Sensors detect a pressure drop and satellite imagery flags unusual activity near a pipeline segment.",
    durationMs: 22000,
  },
  {
    id: "satellite_zoom",
    title: "Satellite View (Fictional)",
    description:
      "A satellite passes over the region and a fictional AI model highlights suspected tampering. This is simplified and not technically accurate.",
    durationMs: 24000,
  },
  {
    id: "device_cloud",
    title: "Device Presence (Anonymized, Hypothetical)",
    description:
      "Anonymous device IDs (Device A, Device B, Device C) appear near the scene. Real telecom data access requires strict legal processes; this is only conceptual.",
    durationMs: 25000,
  },
  {
    id: "network_analysis",
    title: "Network & Timeline Analysis",
    description:
      "Conceptual view of how investigators would visualise devices and movement patterns over time.",
    durationMs: 23000,
  },
  {
    id: "drone_deploy",
    title: "Drone Deployment",
    description:
      "A drone is dispatched from a base to visually confirm the incident and support responders.",
    durationMs: 25000,
  },
  {
    id: "ethics_wrapup",
    title: "Ethical & Legal Boundaries",
    description:
      "Privacy risks and potential misuse require strong legal oversight. This scenario is fictional and educational only.",
    durationMs: 20000,
  },
];

import type { Metadata } from "next";
import { BreathingTrainer } from "./BreathingTrainer";

export const metadata: Metadata = {
  title: "Breathing Practice",
  description:
    "A gentle guided breathing practice with ten rounds per session and private daily progress.",
};

export default function FitnessPage() {
  return <BreathingTrainer />;
}

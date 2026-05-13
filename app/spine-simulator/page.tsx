import { redirect } from "next/navigation";

export const metadata = {
  title: "3D Spine Simulator",
  description: "Interactive nerve chart hosted on this site.",
};

export default function SpineSimulatorIndexPage() {
  redirect("/spine-simulator/nerve_chart/nerve.html");
}

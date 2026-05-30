import { NextResponse } from "next/server";
import { getPublicSkills } from "@/lib/skills";

export const preferredRegion = "hnd1";

export async function GET() {
  const skills = await getPublicSkills();
  return NextResponse.json({ skills });
}

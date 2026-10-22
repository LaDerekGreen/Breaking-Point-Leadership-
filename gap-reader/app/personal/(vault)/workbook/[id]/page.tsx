import { notFound, redirect } from "next/navigation";
import { exercise } from "@/lib/book/workbook";
import { ExerciseForm } from "./ExerciseForm";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (id === 9) redirect("/personal/plan");
  if (!exercise(id)) notFound();
  return <ExerciseForm id={id} />;
}

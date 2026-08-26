import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuizRunner from "@/components/QuizRunner";

export default async function ProvaPage({ params }: { params: { track: string; modulo: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: track } = await supabase.from("tracks").select("id").eq("slug", params.track).single();
  if (!track) notFound();

  const { data: mod } = await supabase
    .from("modules")
    .select("id, title, pass_threshold")
    .eq("track_id", track.id)
    .eq("slug", params.modulo)
    .single();
  if (!mod) notFound();

  const { data: prog } = await supabase
    .from("progress")
    .select("unlocked")
    .eq("user_id", user.id)
    .eq("module_id", mod.id)
    .maybeSingle();
  if (!prog?.unlocked) notFound();

  const { data: existingAttempt } = await supabase
    .from("attempts")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("module_id", mod.id)
    .eq("status", "in_progress")
    .maybeSingle();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, order_index, type, prompt, options, points, min_chars")
    .eq("module_id", mod.id)
    .order("order_index");

  let existingAnswers: Record<string, any> = {};
  if (existingAttempt) {
    const { data: answers } = await supabase
      .from("attempt_answers")
      .select("question_id, selected_option_id, boolean_answer, answer_text")
      .eq("attempt_id", existingAttempt.id);
    for (const a of answers ?? []) {
      existingAnswers[a.question_id] = {
        selectedOptionId: a.selected_option_id,
        booleanAnswer: a.boolean_answer,
        answerText: a.answer_text,
      };
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <QuizRunner
        moduleId={mod.id}
        moduleTitle={mod.title}
        trackSlug={params.track}
        moduleSlug={params.modulo}
        passThreshold={mod.pass_threshold}
        questions={(questions ?? []) as any}
        initialAttemptId={existingAttempt?.id ?? null}
        initialAnswers={existingAnswers}
      />
    </div>
  );
}

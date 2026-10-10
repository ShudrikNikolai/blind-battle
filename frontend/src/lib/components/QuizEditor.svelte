<script lang="ts">
  import { enhance } from '$app/forms';
  import FormErrors from './FormErrors.svelte';
  import type { QuizContent } from '#lib/types/api.ts';

  type Props = {
    initial?: { title: string; content: QuizContent };
    form?: { message?: string; details?: unknown[]; saved?: boolean } | null;
    submitLabel?: string;
  };
  let { initial, form, submitLabel = 'Сохранить' }: Props = $props();

  const emptyQuestion = () => ({
    question: '',
    buttons: [
      { text: '', isCorrectAnswer: true },
      { text: '', isCorrectAnswer: false }
    ]
  });
  const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

  // редактор владеет копией данных
  // svelte-ignore state_referenced_locally
  let title = $state(initial?.title ?? '');
  // svelte-ignore state_referenced_locally
  let timeLimitSec = $state(initial?.content.timeLimitSec ?? 60);
  // svelte-ignore state_referenced_locally
  let questions = $state(initial ? clone(initial.content.questions) : [emptyQuestion()]);
  let saving = $state(false);

  const payload = $derived(JSON.stringify({ title, content: { questions, timeLimitSec } }));

  const setCorrect = (qi: number, bi: number) =>
    questions[qi].buttons.forEach((b, i) => (b.isCorrectAnswer = i === bi));
  const addQuestion = () => questions.length < 30 && questions.push(emptyQuestion());
  const removeQuestion = (qi: number) => questions.length > 1 && questions.splice(qi, 1);
  const addButton = (qi: number) => {
    const b = questions[qi].buttons;
    if (b.length < 4) b.push({ text: '', isCorrectAnswer: false });
  };
  const removeButton = (qi: number, bi: number) => {
    const b = questions[qi].buttons;
    if (b.length <= 2) return;
    const was = b[bi].isCorrectAnswer;
    b.splice(bi, 1);
    if (was) b[0].isCorrectAnswer = true;
  };
</script>

<form
  method="POST"
  class="editor"
  use:enhance={() => {
    saving = true;
    return async ({ update }) => {
      await update({ reset: false });
      saving = false;
    };
  }}
>
  <input type="hidden" name="payload" value={payload} />

  <label>
    Название
    <input bind:value={title} maxlength="200" required />
  </label>

  <label style="max-width:220px">
    Лимит времени, сек (10–3600)
    <input type="number" bind:value={timeLimitSec} min="10" max="3600" required />
  </label>

  {#each questions as q, qi}
    <fieldset class="q">
      <legend>Вопрос {qi + 1}</legend>
      <textarea bind:value={q.question} maxlength="500" rows="2" placeholder="Текст вопроса" required
      ></textarea>

      {#each q.buttons as b, bi}
        <div class="row">
          <input
            type="radio"
            name={`correct-${qi}`}
            checked={b.isCorrectAnswer}
            onchange={() => setCorrect(qi, bi)}
            title="Правильный ответ"
          />
          <input bind:value={b.text} maxlength="64" placeholder={`Вариант ${bi + 1}`} required />
          <button type="button" class="ghost" onclick={() => removeButton(qi, bi)}
            disabled={q.buttons.length <= 2}>✕</button
          >
        </div>
      {/each}

      <div class="row">
        <button type="button" class="ghost" onclick={() => addButton(qi)}
          disabled={q.buttons.length >= 4}>+ вариант</button
        >
        <button type="button" class="ghost" onclick={() => removeQuestion(qi)}
          disabled={questions.length <= 1}>Удалить вопрос</button
        >
      </div>
    </fieldset>
  {/each}

  <button type="button" class="ghost" onclick={addQuestion} disabled={questions.length >= 30}>
    + вопрос ({questions.length}/30)
  </button>

  <FormErrors message={form?.message} details={form?.details} />
  {#if form?.saved}<p style="color:#2f9e44;margin:0">Сохранено</p>{/if}

  <button type="submit" disabled={saving}>{saving ? 'Сохраняем…' : submitLabel}</button>
</form>

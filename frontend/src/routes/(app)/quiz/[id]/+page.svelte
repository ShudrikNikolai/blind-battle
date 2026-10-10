<script lang="ts">
  import QuizEditor from '#lib/components/QuizEditor.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>{data.quiz.title}</title></svelte:head>

<p><a href="/dashboard">← К списку</a></p>
<h1>
  {data.quiz.title}
  <span class="badge" class:on={data.quiz.isPublished}>
    {data.quiz.isPublished ? 'опубликован' : 'черновик'}
  </span>
</h1>

<!-- key: при смене квиза редактор пересоздаётся с новыми данными -->
{#key data.quiz.id}
  <QuizEditor initial={data.quiz} {form} />
{/key}

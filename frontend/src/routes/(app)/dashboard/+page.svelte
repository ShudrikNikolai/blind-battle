<script lang="ts">
  import { enhance } from '$app/forms';
  import FormErrors from '#lib/components/FormErrors.svelte';

  let { data, form } = $props();
  const fmt = (d: string) => new Date(d).toLocaleString('ru-RU');
</script>

<svelte:head><title>Квизы</title></svelte:head>

<div class="toolbar">
  <h1 style="margin:0">Квизы</h1>
  <a class="btn" href="/quiz/new">+ Новый квиз</a>
</div>

<FormErrors message={form?.message} details={form?.details} />

{#if data.quizzes.length === 0}
  <p>Пока нет ни одного квиза.</p>
{:else}
  <table>
    <thead>
      <tr><th>Название</th><th>Вопросов</th><th>Статус</th><th>Создан</th><th></th></tr>
    </thead>
    <tbody>
      {#each data.quizzes as q (q.id)}
        <tr>
          <td><a href={`/quiz/${q.id}`}>{q.title}</a></td>
          <td>{q.content?.questions?.length ?? '—'}</td>
          <td><span class="badge" class:on={q.isPublished}>{q.isPublished ? 'опубликован' : 'черновик'}</span></td>
          <td>{fmt(q.createdAt)}</td>
          <td>
            <form method="POST" action="?/publish" use:enhance>
              <input type="hidden" name="id" value={q.id} />
              <input type="hidden" name="isPublished" value={String(!q.isPublished)} />
              <button class="ghost" type="submit">{q.isPublished ? 'Снять' : 'Опубликовать'}</button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="pager">
    {#if data.meta.hasPrevPage}<a href={`?page=${data.meta.page - 1}`}>← Назад</a>{/if}
    <span>{data.meta.page} / {data.meta.totalPages}</span>
    {#if data.meta.hasNextPage}<a href={`?page=${data.meta.page + 1}`}>Вперёд →</a>{/if}
  </div>
{/if}

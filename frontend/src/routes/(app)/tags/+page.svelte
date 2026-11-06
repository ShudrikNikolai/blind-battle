<script lang="ts">
  import { enhance } from '$app/forms';
  import FormErrors from '#lib/components/FormErrors.svelte';

  let { data, form } = $props();
</script>

<svelte:head><title>Теги</title></svelte:head>

<div class="toolbar">
  <h1 style="margin:0">Теги</h1>
</div>

{#if form?.saved}
  <p style="color:#2f9e44;margin:0">Сохранено</p>
{/if}
<FormErrors message={form?.message} details={form?.details} />

<form class="card" method="POST" action="?/create" use:enhance>
  <h2 style="margin:0">Новый тег</h2>
  <label>
    Название
    <input name="name" maxlength="64" required placeholder="Программирование" />
  </label>
  <button type="submit">Создать</button>
</form>

{#if data.tags.length === 0}
  <p>Пока нет ни одного тега.</p>
{:else}
  <table>
    <thead>
      <tr>
        <th>Название</th>
        <th>Статус</th>
        <th>Публикация</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each data.tags as tag (tag.id)}
        <tr>
          <td>
            <form method="POST" action="?/rename" class="row" use:enhance>
              <input type="hidden" name="id" value={tag.id} />
              <input name="name" value={tag.name} maxlength="64" required />
              <button class="ghost" type="submit">Переименовать</button>
            </form>
          </td>
          <td>
            <span class="badge" class:on={tag.isPublished}>
              {tag.isPublished ? 'опубликован' : 'черновик'}
            </span>
          </td>
          <td>
            <form method="POST" action="?/publish" use:enhance>
              <input type="hidden" name="id" value={tag.id} />
              <input type="hidden" name="isPublished" value={String(!tag.isPublished)} />
              <button class="ghost" type="submit">
                {tag.isPublished ? 'Снять' : 'Опубликовать'}
              </button>
            </form>
          </td>
          <td>
            <form
              method="POST"
              action="?/delete"
              use:enhance
              onsubmit={(event) => {
                if (!confirm(`Удалить тег «${tag.name}»? Связанные квизы станут черновиками.`)) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="id" value={tag.id} />
              <button class="ghost" type="submit">Удалить</button>
            </form>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  let { data, children } = $props();
</script>

<header class="bar">
  <nav class="menu">
    <strong>Quizzle Admin</strong>
    <a
      href={resolve('/(app)/dashboard')}
      style:opacity={page.url.pathname.startsWith('/dashboard') ? 1 : null}>Квизы</a
    >
    <a
      href={resolve('/(app)/tags')}
      style:opacity={page.url.pathname.startsWith('/tags') ? 1 : null}>Теги</a
    >
    <a
      href={resolve('/(app)/settings')}
      style:opacity={page.url.pathname.startsWith('/settings') ? 1 : null}>Настройки</a
    >
  </nav>
  <form method="POST" action="/logout" style="display:flex;gap:.75rem;align-items:center">
    <span>{data.user?.login}</span>
    <button class="ghost" type="submit">Выйти</button>
  </form>
</header>

<main class="content">
  {@render children()}
</main>

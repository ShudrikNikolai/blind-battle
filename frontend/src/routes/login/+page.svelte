<script lang="ts">
  import { enhance } from '$app/forms';
  import FormErrors from '#lib/components/FormErrors.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();
  let loading = $state(false);
</script>

<svelte:head><title>Вход</title></svelte:head>

<div class="center">
  <form
    class="card"
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update({ reset: false });
        loading = false;
      };
    }}
  >
    <h1 style="margin:0">Вход</h1>

    <label>
      Логин
      <input name="login" autocomplete="username" required maxlength="64" value={form?.login ?? ''} />
    </label>

    <label>
      Пароль
      <input name="password" type="password" autocomplete="current-password" required maxlength="128" />
    </label>

    <FormErrors message={form?.message} details={form?.details} />

    <button type="submit" disabled={loading}>{loading ? 'Входим…' : 'Войти'}</button>
  </form>
</div>

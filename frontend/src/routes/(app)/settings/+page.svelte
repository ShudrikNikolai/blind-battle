<script lang="ts">
  import { enhance } from '$app/forms';
  import FormErrors from '#lib/components/FormErrors.svelte';

  let { form } = $props();
</script>

<svelte:head><title>Настройки</title></svelte:head>

<h1>Настройки</h1>

<div class="cards">
  <form class="card" method="POST" action="?/password" use:enhance>
    <h2 style="margin:0">Смена пароля</h2>
    <label>
      Текущий пароль
      <input name="oldPassword" type="password" autocomplete="current-password" required maxlength="128" />
    </label>
    <label>
      Новый пароль (от 8 символов)
      <input name="newPassword" type="password" autocomplete="new-password" required minlength="8" maxlength="128" />
    </label>
    {#if form?.form === 'password'}
      {#if 'ok' in form}<p style="color:#2f9e44;margin:0">Пароль изменён</p>{/if}
      {#if 'message' in form}<FormErrors message={form.message} details={form.details} />{/if}
    {/if}
    <button type="submit">Сменить пароль</button>
  </form>

  <form class="card" method="POST" action="?/admin" use:enhance>
    <h2 style="margin:0">Новый админ</h2>
    <label>
      Логин (3–64)
      <input name="login" autocomplete="off" required minlength="3" maxlength="64" />
    </label>
    <label>
      Пароль (от 8 символов)
      <input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128" />
    </label>
    {#if form?.form === 'admin'}
      {#if 'ok' in form}<p style="color:#2f9e44;margin:0">Админ создан</p>{/if}
      {#if 'message' in form}<FormErrors message={form.message} details={form.details} />{/if}
    {/if}
    <button type="submit">Создать</button>
  </form>
</div>

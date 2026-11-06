<script lang="ts">
  import { resolve } from '$app/paths';
  import QuizEditor from '#lib/components/QuizEditor.svelte';
  let { data, form } = $props();
</script>

<svelte:head><title>Новый квиз</title></svelte:head>

<p><a href={resolve('/(app)/dashboard')}>← К списку</a></p>
<h1>Новый квиз</h1>
<QuizEditor {form} tags={data.tags} submitLabel="Создать" />

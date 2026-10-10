<script lang="ts">
  import QuizEditor from '#lib/components/QuizEditor.svelte';
  let { form } = $props();
</script>

<svelte:head><title>Новый квиз</title></svelte:head>

<p><a href="/dashboard">← К списку</a></p>
<h1>Новый квиз</h1>
<QuizEditor {form} submitLabel="Создать" />

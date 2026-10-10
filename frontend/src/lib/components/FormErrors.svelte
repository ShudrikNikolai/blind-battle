<script lang="ts">
  import type { ValidationDetail } from '#lib/types/api.ts';

  let { message, details = [] }: { message?: string; details?: unknown[] } = $props();

  const fmt = (d: unknown) => {
    const x = d as ValidationDetail;
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object' && 'message' in x) {
      return x.field ? `${x.field}: ${x.message}` : x.message;
    }
    return JSON.stringify(d);
  };
</script>

{#if message}
  <div class="error">
    <p style="margin:0">{message}</p>
    {#if details.length}
      <ul style="margin:.25rem 0 0; padding-left:1.1rem">
        {#each details as d}<li>{fmt(d)}</li>{/each}
      </ul>
    {/if}
  </div>
{/if}

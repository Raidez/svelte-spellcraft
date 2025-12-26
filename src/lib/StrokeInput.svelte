<script lang="ts">
    let { strokeWidth = $bindable(10) }: { strokeWidth: number } = $props();
</script>

<label class="my-4">
    <span class="inline-block">Stroke Width</span>
    <input
        class="align-bottom mx-2"
        type="range"
        min="5"
        max="30"
        bind:value={strokeWidth}
    />
    <span class="inline-block w-10">{strokeWidth} px</span>
</label>

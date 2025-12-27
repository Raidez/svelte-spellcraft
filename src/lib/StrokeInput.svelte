<script lang="ts">
    let { strokeWidth = $bindable(10) }: { strokeWidth: number } = $props();
</script>

<label class="my-4">
    <span class="block lg:inline-block text-sm lg:text-base">Stroke Width</span>
    <input
        class="align-bottom mx-2 text-sm lg:text-base"
        type="range"
        min="5"
        max="30"
        bind:value={strokeWidth}
    />
    <span class="inline-block w-10">{strokeWidth} px</span>
</label>

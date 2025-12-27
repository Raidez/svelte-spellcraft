<script lang="ts">
    let {
        strokeWidth = $bindable(10),
        eraserMode = $bindable(false),
        pressureMode = $bindable(true),
    }: {
        strokeWidth: number;
        eraserMode: boolean;
        pressureMode: boolean;
    } = $props();
</script>

<div class="text-sm lg:text-base m-2 p-2 w-full md:w-auto box-content">
    <label class="my-4">
        <span class="">Stroke Width</span>
        <input
            class="align-bottom mx-2"
            type="range"
            min="5"
            max="30"
            bind:value={strokeWidth}
        />
        <span class="inline-block w-10">{strokeWidth} px</span>
    </label>

    <div class="flex flex-row justify-between">
        <label>
            <input class="hidden" type="checkbox" bind:checked={pressureMode} />
            <span>Pressure mode</span>
            {#if pressureMode}
                <i class="bi bi-pen-fill mx-1.5"></i>
            {:else}
                <i class="bi bi-pen mx-1.5"></i>
            {/if}
        </label>
        <label>
            <input class="hidden" type="checkbox" bind:checked={eraserMode} />
            {#if eraserMode}
                <i class="bi bi-eraser-fill mx-1.5"></i>
            {:else}
                <i class="bi bi-eraser mx-1.5"></i>
            {/if}
            <span>Eraser mode</span>
        </label>
    </div>
</div>

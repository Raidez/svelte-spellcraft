<script lang="ts">
    import starGray from "../assets/star.gray.svg";
    import starYellow from "../assets/star.yellow.svg";
    import starSpecial from "../assets/star.special.svg";

    let {
        sim = 0,
        score = 0,
        isSpecial = false,
    }: { sim: number; score: number; isSpecial: boolean } = $props();
</script>

<div>
    {#each Array(3) as _, i}
        <img
            class="inline-block"
            src={i < score && !isNaN(sim)
                ? isSpecial
                    ? starSpecial
                    : starYellow
                : starGray}
            alt="star"
            width="32"
            height="32"
        />
    {/each}
    <div class="text-center">
        {#if sim === 0 || isNaN(sim)}
            <span>N/A</span>
        {:else}
            <span>{sim.toFixed(4)}</span>
        {/if}
    </div>
</div>

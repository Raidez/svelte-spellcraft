<script lang="ts">
    let {
        size = $bindable(10),
        isVisible = $bindable(true),
    }: {
        size: number;
        isVisible: boolean;
    } = $props();

    let position = $state({ x: 0, y: 0 });

    function handleMouseMove(event: MouseEvent) {
        position.x = event.pageX - size / 2;
        position.y = event.pageY - size / 2;
    }

    $effect(() => {
        document.addEventListener("mousemove", handleMouseMove);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
        };
    });
</script>

<div
    class="absolute border border-black rounded-full pointer-events-none z-50"
    class:hidden={!isVisible}
    style={`width: ${size}px; height: ${size}px; left: ${position.x}px; top: ${position.y}px;`}
></div>

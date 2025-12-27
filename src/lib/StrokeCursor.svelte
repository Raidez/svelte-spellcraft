<script lang="ts">
    let {
        size = $bindable(10),
        isVisible = $bindable(true),
    }: {
        size: number;
        isVisible: boolean;
    } = $props();

    let position = $state({ x: 0, y: 0 });

    function handlePointerDown(event: PointerEvent): void {
        if (event.pointerType !== "mouse") {
            position = { x: 0, y: 0 };
            isVisible = false;
        }
    }

    function handlePointerMove(event: PointerEvent): void {
        if (event.pointerType !== "mouse") {
            position = { x: 0, y: 0 };
            isVisible = false;
            return;
        }

        position.x = event.pageX - size / 2;
        position.y = event.pageY - size / 2;
    }

    $effect(() => {
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("pointermove", handlePointerMove);

        return () => {
            document.removeEventListener("pointermove", handlePointerMove);
        };
    });
</script>

<div
    class="absolute border border-black rounded-full pointer-events-none z-50"
    class:hidden={!isVisible}
    style={`width: ${size}px; height: ${size}px; left: ${position.x}px; top: ${position.y}px;`}
></div>

<script lang="ts">
    import cv from "@techstark/opencv-js";
    import { generateShortId } from "../main";
    import type { MouseEventHandler } from "svelte/elements";

    let {
        width,
        height,
        strokeWidth = $bindable(10),
        eraserMode = $bindable(false),
        pressureMode = $bindable(true),
        onclear = null,
        onchange = null,
        onupload = null,
        onmouseover = null,
        onmouseout = null,
    }: {
        width: number;
        height: number;
        strokeWidth: number;
        eraserMode: boolean;
        pressureMode: boolean;
        onclear: Function | null;
        onchange: Function | null;
        onupload: Function | null;
        onmouseover: MouseEventHandler<HTMLCanvasElement> | null;
        onmouseout: MouseEventHandler<HTMLCanvasElement> | null;
    } = $props();

    const lastPosition = { x: 0, y: 0 };
    let isPointerDown = false;

    type EventData = {
        position: { x: number; y: number };
        pressure: number;
        drawColor: string;
    };

    let canvasElement: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;

    $effect(() => {
        let context = canvasElement.getContext("2d");
        if (context) {
            ctx = context;

            // Initialize canvas with white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);
        }
    });

    export function getCanvasContext(): CanvasRenderingContext2D {
        return ctx;
    }

    function handleUpload(): void {
        console.log("Upload image");
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = function (event: Event) {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                const img = document.createElement("img");
                img.onload = handleImageLoad;
                img.src = URL.createObjectURL(files[0]);
            }
        };
        input.click();
    }

    export function checkEmptyCanvas(): boolean {
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        for (let i = 0; i < pixels.length; i += 4) {
            if (
                pixels[i] !== 255 ||
                pixels[i + 1] !== 255 ||
                pixels[i + 2] !== 255
            ) {
                return false; // Found a non-white pixel
            }
        }
        return true; // All pixels are white
    }

    export function getImageURL(): string {
        return canvasElement.toDataURL();
    }

    function handleDownload(): void {
        if (checkEmptyCanvas()) {
            alert("The canvas is empty!");
            return;
        }

        console.log("Download image");

        const link = document.createElement("a");
        link.download = `image_${generateShortId()}.png`;
        link.href = canvasElement.toDataURL();
        link.click();
    }

    function handleImageLoad(event: Event): void {
        console.log("Image loaded");
        const src = cv.imread(event.target as HTMLImageElement);
        cv.imshow(canvasElement, src);
        src.delete();
        onupload?.();
    }

    function handleClear(): void {
        console.log("Clear canvas");
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);
        onclear?.();
    }

    // Pointer event handlers
    function gatherEventData(event: PointerEvent): EventData {
        const position = {
            x: event.offsetX,
            y: event.offsetY,
        };

        let pressure = 0.0;
        if (
            pressureMode &&
            (event.pointerType === "pen" || event.pointerType === "touch")
        ) {
            pressure = event.pressure;
        }

        let drawColor = "black";
        if (
            eraserMode ||
            (event.pointerType === "mouse" &&
                (event.button === 2 || event.buttons === 2))
        ) {
            drawColor = "white";
        }

        return { position, pressure, drawColor };
    }

    function onpointerdown(event: PointerEvent): void {
        event.preventDefault();

        // Gather event data
        const { position, pressure, drawColor } = gatherEventData(event);

        // Adjust stroke size based on pressure (1 to 2 times)
        const strokeSize = strokeWidth * (1.0 + pressure * 1.0);

        // Draw circle
        ctx.fillStyle = drawColor;
        ctx.beginPath();
        ctx.arc(position.x, position.y, strokeSize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Store last position
        lastPosition.x = position.x;
        lastPosition.y = position.y;
        isPointerDown = true;
    }

    function onpointermove(event: PointerEvent): void {
        event.preventDefault();
        if (!isPointerDown) {
            return;
        }

        // Gather event data
        const { position, pressure, drawColor } = gatherEventData(event);

        // Adjust stroke size based on pressure (1 to 2 times)
        const strokeSize = strokeWidth * (1.0 + pressure * 1.0);

        // Draw line
        ctx.lineCap = "round";
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = strokeSize;
        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();

        // Update last touch position
        lastPosition.x = position.x;
        lastPosition.y = position.y;
        onchange?.();
    }

    function onpointerup(event: PointerEvent): void {
        event.preventDefault();
        if (!isPointerDown) {
            return;
        }

        // Gather event data
        const { position, pressure, drawColor } = gatherEventData(event);

        // Adjust stroke size based on pressure (1 to 2 times)
        const strokeSize = strokeWidth * (1.0 + pressure * 1.0);

        // Draw line
        ctx.lineCap = "round";
        ctx.strokeStyle = drawColor;
        ctx.lineWidth = strokeSize;
        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();

        // Update last touch position
        lastPosition.x = position.x;
        lastPosition.y = position.y;
        isPointerDown = false;
        onchange?.();
    }
</script>

<div class="relative flex flex-col">
    <button
        class="bg-red-600 w-8 h-8 rounded-bl-md flex items-center justify-center absolute top-0 right-0 m-2 cursor-pointer"
        onclick={handleClear}
        title="Clear"
    >
        <i class="bi bi-x-lg"></i>
    </button>
    <canvas
        class="border box-content m-2 XXXcursor-none touch-none"
        {width}
        {height}
        bind:this={canvasElement}
        oncontextmenu={(event: Event) => event.preventDefault()}
        {onpointerdown}
        {onpointermove}
        {onpointerup}
        {onmouseover}
        {onmouseout}
        onblur={null}
        onfocus={null}
    >
    </canvas>
    <div class="flex flex-row px-5 lg:px-0">
        <button
            class="m-2 grow border rounded-lg py-2 px-3 bg-amber-600 hover:bg-amber-700 cursor-pointer"
            onclick={handleUpload}
        >
            Upload
            <i class="bi bi-cloud-arrow-up"></i>
        </button>
        <button
            class="m-2 border rounded-lg py-2 px-3 bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
            onclick={handleDownload}
        >
            Download
            <i class="bi bi-cloud-arrow-down"></i>
        </button>
    </div>
</div>

<script lang="ts">
    import cv from "@techstark/opencv-js";
    import { generateShortId } from "../main";

    let {
        width,
        height,
        strokeWidth = $bindable(10),
        onclear = null,
        onchange = null,
        onupload = null,
        onmouseover = null,
        onmouseout = null,
    }: {
        width: number;
        height: number;
        strokeWidth: number;
        onclear: Function | null;
        onchange: Function | null;
        onupload: Function | null;
        onmouseover: Function | null;
        onmouseout: Function | null;
    } = $props();

    let canvasElement: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D;
    let isDrawing = false;
    let isEraserMode = false;
    let mousePos = { x: 0, y: 0 };

    const lastTouch = { x: 0, y: 0 };

    $effect(() => {
        let context = canvasElement.getContext("2d");
        if (context) {
            ctx = context;

            // Initialize canvas with white background
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, width, height);

            // Set default stroke style
            ctx.strokeStyle = "black";
        }

        canvasElement.addEventListener("touchstart", handleTouchStart, {
            passive: false,
        });
        canvasElement.addEventListener("touchmove", handleTouchMove, {
            passive: false,
        });
        canvasElement.addEventListener("touchend", handleTouchEnd, {
            passive: false,
        });

        return () => {
            canvasElement.removeEventListener("touchstart", handleTouchStart);
            canvasElement.removeEventListener("touchmove", handleTouchMove);
            canvasElement.removeEventListener("touchend", handleTouchEnd);
        };
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

    function handleMouseDown(event: MouseEvent): void {
        event.preventDefault();

        // Start drawing or erasing
        isDrawing = event.button === 0;
        isEraserMode = event.button === 2;

        // Update mouse position
        mousePos = { x: event.offsetX, y: event.offsetY };
    }

    function handleMouseMove(event: MouseEvent): void {
        // Draw/erase on canvas
        if (isEraserMode) {
            ctx.strokeStyle = "rgba(255,255,255,1)";
        } else {
            ctx.strokeStyle = "black";
        }

        if (isDrawing || isEraserMode) {
            ctx.lineCap = "round";
            ctx.lineWidth = strokeWidth;
            ctx.beginPath();
            ctx.moveTo(mousePos.x, mousePos.y);
            ctx.lineTo(event.offsetX, event.offsetY);
            ctx.stroke();

            onchange?.();
        }

        // Update mouse position
        mousePos = { x: event.offsetX, y: event.offsetY };
    }

    function handleMouseWheel(event: WheelEvent): void {
        // Control stroke width with mouse wheel
        event.preventDefault();
        const delta = -Math.sign(event.deltaY);
        strokeWidth = Math.min(30, Math.max(5, strokeWidth + delta));
    }

    function handleStopDrawing(event: Event): void {
        event.preventDefault();

        isDrawing = false;
        isEraserMode = false;
    }

    function handleMouseOver(): void {
        onmouseover?.();
    }

    function handleMouseOut(): void {
        onmouseout?.();
    }

    function handleContextMenu(event: MouseEvent): void {
        event.preventDefault();
    }

    // Touch event handlers
    function handleTouchStart(event: TouchEvent): void {
        event.preventDefault();

        const touch = event.changedTouches[0];
        const elementRect = canvasElement.getBoundingClientRect();
        const position = {
            x: touch.clientX - elementRect.left,
            y: touch.clientY - elementRect.top,
        };

        // Draw a dot at the touch position
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(position.x, position.y, strokeWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        // Store last touch position
        lastTouch.x = position.x;
        lastTouch.y = position.y;
    }

    function handleTouchMove(event: TouchEvent): void {
        event.preventDefault();

        const touch = event.changedTouches[0];
        const elementRect = canvasElement.getBoundingClientRect();
        const position = {
            x: touch.clientX - elementRect.left,
            y: touch.clientY - elementRect.top,
        };

        // Draw line from last touch position to current position
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(lastTouch.x, lastTouch.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();

        // Update last touch position
        lastTouch.x = position.x;
        lastTouch.y = position.y;
    }

    function handleTouchEnd(event: TouchEvent): void {
        event.preventDefault();

        const touch = event.changedTouches[0];
        const elementRect = canvasElement.getBoundingClientRect();
        const position = {
            x: touch.clientX - elementRect.left,
            y: touch.clientY - elementRect.top,
        };

        // Draw line from last touch position to current position
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
        ctx.lineWidth = strokeWidth;
        ctx.beginPath();
        ctx.moveTo(lastTouch.x, lastTouch.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();

        // Update last touch position
        lastTouch.x = position.x;
        lastTouch.y = position.y;
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
        class="border box-content m-2 cursor-none"
        {width}
        {height}
        bind:this={canvasElement}
        oncontextmenu={handleContextMenu}
        onwheel={handleMouseWheel}
        onmousedown={handleMouseDown}
        onmousemove={handleMouseMove}
        onmouseup={handleStopDrawing}
        onblur={handleStopDrawing}
        onmouseout={handleMouseOut}
        onmouseover={handleMouseOver}
        onfocus={handleMouseOver}
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

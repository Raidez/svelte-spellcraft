<script lang="ts">
    import cv from "@techstark/opencv-js";
    import testImageMatching from "./imageMatching";

    import ResultTable from "./lib/ResultTable.svelte";
    import StrokeInput from "./lib/StrokeInput.svelte";
    import CanvasInput from "./lib/CanvasInput.svelte";
    import StrokeCursor from "./lib/StrokeCursor.svelte";
    import ScoreDisplay from "./lib/ScoreDisplay.svelte";

    let strokeWidth = $state(10);
    let sim = $state(0);
    let score = $state(0);
    let isSpecial = $state(false);
    let cursorVisible = $state(false);
    let results = $state<any[]>([]);

    let canvas1: CanvasInput;
    let canvas2: CanvasInput;
    const width = 400;
    const height = 400;

    function handleImagesComparaison() {
        if (!canvas1 || !canvas2) {
            alert("Canvases not initialized yet!");
            return;
        } else if (canvas1.checkEmptyCanvas() || canvas2.checkEmptyCanvas()) {
            alert("One canvas is empty!");
            return;
        }

        console.log("Compare images");

        const ctx1 = canvas1.getCanvasContext();
        const ctx2 = canvas2.getCanvasContext();

        const imgData1 = ctx1.getImageData(0, 0, width, height);
        const imgData2 = ctx2.getImageData(0, 0, width, height);

        const img1 = cv.matFromImageData(imgData1);
        const img2 = cv.matFromImageData(imgData2);
        sim = testImageMatching(img1, img2);
        console.log(`Similarity: ${sim}`);

        if (sim < 0.5) {
            score = 0;
        } else if (sim < 0.55) {
            score = 1;
        } else if (sim < 0.65) {
            score = 2;
        } else {
            score = 3;
        }

        isSpecial = sim > 0.8;

        // Clean up
        img1.delete();
        img2.delete();

        // Store result
        results.push({
            A: canvas1.getImageURL(),
            B: canvas2.getImageURL(),
            sim,
        });
    }

    function handleResetScore() {
        sim = 0;
        score = 0;
        isSpecial = false;
    }

    function handleCursorIsVisible() {
        cursorVisible = true;
    }

    function handleCursorIsNotVisible() {
        cursorVisible = false;
    }
</script>

<StrokeCursor bind:size={strokeWidth} bind:isVisible={cursorVisible} />

<main class="flex flex-col items-center pt-2 lg:p-10">
    <h1 class="text-4xl mb-2">SpellCraft</h1>

    <StrokeInput bind:strokeWidth />

    <div class="flex flex-col lg:flex-row">
        <CanvasInput
            bind:this={canvas1}
            {width}
            {height}
            bind:strokeWidth
            onclear={handleResetScore}
            onchange={handleResetScore}
            onupload={handleResetScore}
            onmouseover={handleCursorIsVisible}
            onmouseout={handleCursorIsNotVisible}
        />

        <div
            class="w-full lg:w-62 my-5 lg:my-0 px-5 lg:px-0 order-last lg:order-0 flex flex-col items-center justify-center"
        >
            <button
                class="w-full lg:w-auto m-2 border rounded-lg py-2 px-3 bg-sky-500 hover:bg-sky-700 cursor-pointer"
                onclick={handleImagesComparaison}
            >
                Compare images
                <i class="bi bi-transparency"></i>
            </button>

            <ScoreDisplay {sim} {score} {isSpecial} />
        </div>

        <CanvasInput
            bind:this={canvas2}
            {width}
            {height}
            bind:strokeWidth
            onclear={handleResetScore}
            onchange={handleResetScore}
            onupload={handleResetScore}
            onmouseover={handleCursorIsVisible}
            onmouseout={handleCursorIsNotVisible}
        />
    </div>

    <ResultTable bind:results />
</main>

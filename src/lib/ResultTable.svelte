<script lang="ts">
    import JSZip from "jszip";
    import { generateShortId, type Result } from "../main";

    let {
        results = $bindable<Result[]>([]),
    }: {
        results: Result[];
    } = $props();

    function clearResults() {
        results = [];
    }

    function removeLine(index: number) {
        results.splice(index, 1);
    }

    interface Image {
        url: string;
        uid?: string;
    }

    function generateUniqueId(existingIds: Set<string>): string {
        let id = generateShortId();
        while (existingIds.has(id)) {
            id = generateShortId();
        }
        existingIds.add(id);
        return id;
    }

    function extractImageData(
        url: string,
        images: Array<Image>,
        uids: Set<string>,
    ): [string, string] {
        let uid = "";

        const image = images.find((img) => img.url === url);
        if (image) {
            uid = image.uid!;
        } else {
            uid = generateUniqueId(uids);
            images.push({ url: url, uid: uid });
        }

        const imageName = `image_${uid}.png`;
        const base64Data = url.split(",")[1];

        return [imageName, base64Data];
    }

    async function handleDownload() {
        const uids = new Set<string>();
        const images: Array<Image> = [];

        const zip = new JSZip();
        const img = zip.folder("images");

        // Save images
        const finalResults = results.map((result) => {
            // Save image files
            const [imageAName, base64DataA] = extractImageData(
                result.A,
                images,
                uids,
            );
            const [imageBName, base64DataB] = extractImageData(
                result.B,
                images,
                uids,
            );
            img?.file(imageAName, base64DataA, { base64: true });
            img?.file(imageBName, base64DataB, { base64: true });

            return {
                imageA: `images/${imageAName}`,
                imageB: `images/${imageBName}`,
                similarity: result.sim,
            };
        });

        // Save results.json
        zip?.file("results.json", JSON.stringify(finalResults, null, 4));

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = "results.zip";
        link.click();
    }
</script>

<div class="my-10 overflow-x-auto border-t pt-4">
    <table>
        <thead>
            <tr>
                <th class="p-2">Image A</th>
                <th class="p-2">Image B</th>
                <th class="p-2">Similarity</th>
                <th class="p-2"> </th>
            </tr>
        </thead>
        <tbody>
            {#each results as result, i}
                <tr
                    class="align-top border-b hover:bg-stone-600"
                    class:bg-stone-700={i % 2 === 1}
                >
                    <td class="p-2">
                        <img src={result.A} width="100" alt="A" />
                    </td>
                    <td class="p-2">
                        <img src={result.B} width="100" alt="B" />
                    </td>
                    <td class="p-2">{result.sim.toFixed(4)} </td>
                    <td class="p-2">
                        <a
                            class="bi bi-x-circle text-xl text-red-600 hover:text-red-700 cursor-pointer"
                            title="Remove"
                            onclick={() => removeLine(i)}
                            href="#noop"
                        ></a>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
    {#if results.length === 0}
        <p class="p-4 text-center">No results yet.</p>
    {:else}
        <div class="flex justify-center my-4">
            <button
                class="m-2 border rounded-lg py-2 px-3 bg-red-600 hover:bg-red-700 cursor-pointer"
                onclick={clearResults}
            >
                Clear
                <i class="bi bi-trash"></i>
            </button>
            <button
                class="m-2 border rounded-lg py-2 px-3 bg-violet-600 hover:bg-violet-700 cursor-pointer"
                onclick={handleDownload}
            >
                Download
                <i class="bi bi-cloud-arrow-down"></i>
            </button>
        </div>
    {/if}
</div>

<script setup lang="ts">
// Load image and resize to 200x200 and draw into canvas
import { onMounted } from "vue";
import { dither, solve, type ImageArray } from "./utils";

const width = 200;
const height = 200;
const n = ref(1000);
const maxItr = ref(10000000); // Maximum iterations for the solver
const currentItr = ref(0); // Current iteration count
const answer = ref([{ i: 0, j: 0 }]);
const currentSimilarity = ref(0); // Similarity score
const strokeWidth = ref(1.5); // Stroke width for the lines

let frontImg: ImageArray = new Int32Array(width * height);
let backImg: ImageArray = new Int32Array(width * height);

const imageDataToImg = (imageData: ImageData): ImageArray => {
  const img: ImageArray = new Int32Array(width * height);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4;
      const r = imageData.data[index]!;
      const g = imageData.data[index + 1]!;
      const b = imageData.data[index + 2]!;
      img[i * width + j] = r > 128 || g > 128 || b > 128 ? 0 : 1; // Convert to binary
    }
  }
  return img;
};

const viewBox = computed(() => {
  return `0 0 ${width} ${height}`;
});

const drawImage = (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  flip: boolean
): ImageArray => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return new Int32Array(width * height).fill(0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  if (flip) {
    // Horizontally flip the image
    ctx.scale(-1, 1);
    ctx.drawImage(img, -canvas.width, 0, canvas.width, canvas.height);
    ctx.scale(-1, 1); // Reset scale to normal
  }
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const ditheredImageData = dither(imageData);
  ctx.putImageData(ditheredImageData, 0, 0);
  return imageDataToImg(ditheredImageData);
};

const uploadFrontImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    frontImg = drawImage(
      document.getElementById("front-ref") as HTMLCanvasElement,
      img,
      false
    );
  };
};

const uploadBackImage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  if (!file) return;
  const img = new Image();
  img.src = URL.createObjectURL(file);
  img.onload = () => {
    backImg = drawImage(
      document.getElementById("back-ref") as HTMLCanvasElement,
      img,
      true
    );
  };
};

onMounted(() => {
  {
    const canvas = document.getElementById("front-ref") as HTMLCanvasElement;
    const img = new Image();
    img.src = "/reversible-stitch/front.png";
    img.onload = () => {
      frontImg = drawImage(canvas, img, false);
    };
  }
  {
    const canvas = document.getElementById("back-ref") as HTMLCanvasElement;
    const img = new Image();
    img.src = "/reversible-stitch/back.png";
    img.onload = () => {
      backImg = drawImage(canvas, img, true);
    };
  }
});

const onClickSolve = async () => {
  answer.value = await solve(
    width,
    height,
    frontImg,
    backImg,
    n.value,
    maxItr.value,
    (bestAnswer, iter, similarity) => {
      answer.value = [];
      answer.value = bestAnswer;
      currentItr.value = iter;
      currentSimilarity.value = similarity;
    }
  );
};
</script>
<template>
  <div>
    <h1>Reversible stitch</h1>
    <div>
      <canvas id="front-ref" ref="front-ref" :width :height></canvas>
      <canvas id="back-ref" ref="back-ref" :width :height class="flip"></canvas>
    </div>
    <div>
      <input type="file" accept="image/*" @change="uploadFrontImage" />
      <input type="file" accept="image/*" @change="uploadBackImage" />
    </div>
    <div>
      <p>
        n: <input v-model.number="n" step="50" type="number" /> Max Iterations:
        <input v-model.number="maxItr" type="number" />
        <button @click="onClickSolve">Solve</button>
        Current iteration: {{ currentItr }} / {{ maxItr }} ({{
          Math.round((currentItr / maxItr) * 100)
        }}%) Similarity: {{ currentSimilarity }}
      </p>
    </div>
    <div>
      <svg :viewBox="viewBox">
        <g v-for="(item, index) in answer" :key="index">
          <line
            v-if="index > 0 && index % 2 === 1"
            :x1="answer[index-1]!.j"
            :y1="answer[index-1]!.i"
            :x2="answer[index]!.j"
            :y2="answer[index]!.i"
            stroke="black"
          ></line>
        </g>
      </svg>
      <svg :viewBox="viewBox" class="flip">
        <g v-for="(item, index) in answer" :key="index">
          <line
            v-if="index > 0 && index % 2 === 0"
            :x1="answer[index-1]!.j"
            :y1="answer[index-1]!.i"
            :x2="answer[index]!.j"
            :y2="answer[index]!.i"
            stroke="black"
          ></line>
        </g>
      </svg>
      <svg :viewBox="viewBox">
        <g v-for="(item, index) in answer" :key="index">
          <line
            v-if="index > 0"
            :x1="answer[index-1]!.j"
            :y1="answer[index-1]!.i"
            :x2="answer[index]!.j"
            :y2="answer[index]!.i"
            :stroke="index % 2 === 0 ? '#ff000044' : '#0000ff44'"
          ></line>
        </g>
      </svg>
    </div>
    <div>
      <label for="stroke-width">Stroke Width:</label>
      <input
        id="stroke-width"
        v-model.number="strokeWidth"
        type="range"
        step="0.01"
        min="0.01"
        max="2"
      />
    </div>
  </div>
</template>
<style>
canvas {
  width: 400px;
  height: 400px;
  image-rendering: pixelated;
  border: 1px solid black;
}
svg {
  width: 400px;
  height: 400px;
  border: 1px solid black;
}
line {
  stroke-width: v-bind(strokeWidth);
  stroke-linecap: round;
}

.flip {
  transform: scaleX(-1);
}
</style>

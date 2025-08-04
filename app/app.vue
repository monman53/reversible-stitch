<script setup lang="ts">
// Load image and resize to 200x200 and draw into canvas
import { onMounted } from "vue";
import { dither, solve } from "./utils";

const width = 200;
const height = 200;
const n = 200;

const answer = ref([{ i: 0, j: 0 }]);

let frontImg: number[][] = Array.from({ length: height }, () =>
  Array(width).fill(0)
);
let backImg: number[][] = Array.from({ length: height }, () =>
  Array(width).fill(0)
);

const imageDataToImg = (imageData: ImageData): number[][] => {
  const img: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      img[i][j] = r > 128 || g > 128 || b > 128 ? 0 : 1; // Convert to binary
    }
  }
  return img;
};

onMounted(() => {
  {
    const canvas = document.getElementById("front-ref") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = "/front.png";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const ditheredImageData = dither(imageData);
      frontImg = imageDataToImg(ditheredImageData);
      ctx.putImageData(ditheredImageData, 0, 0);
    };
  }
  {
    const canvas = document.getElementById("back-ref") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = "/back.png";
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const ditheredImageData = dither(imageData);
      backImg = imageDataToImg(ditheredImageData);
      ctx.putImageData(ditheredImageData, 0, 0);
    };
  }
  answer.value = solve(width, height, frontImg, backImg, n);
});

const onClickSolve = () => {
  answer.value = solve(width, height, frontImg, backImg, n);
};
</script>
<template>
  <div>
    <h1>Reversible stitch</h1>
    <div>
      <canvas id="front-ref" ref="front-ref" :width :height></canvas>
      <canvas id="back-ref" ref="back-ref" :width :height></canvas>
    </div>
    <button @click="onClickSolve">Solve</button>
    <div>
      <svg viewBox="0 0 200 200">
        <g v-for="(item, index) in answer" :key="index">
          <line
            v-if="index > 0"
            :x1="answer[index-1]!.j"
            :y1="answer[index-1]!.i"
            :x2="answer[index]!.j"
            :y2="answer[index]!.i"
            stroke="black"
          ></line>
        </g>
      </svg>
    </div>
    <div>
      <svg viewBox="0 0 200 200">
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
      <svg viewBox="0 0 200 200">
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
    </div>
  </div>
</template>
<style>
canvas {
  width: 400px;
  height: 400px;
  image-rendering: pixelated;
}
svg {
  width: 400px;
  height: 400px;
}
</style>

<script setup lang="ts">
// Load image and resize to 200x200 and draw into canvas
import { onMounted } from "vue";
import { dither, solve } from "./utils";

const width = 200;
const height = 200;
const n = 100;

const answer = ref([{ i: 0, j: 0 }]);

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
      ctx.putImageData(ditheredImageData, 0, 0);
    };
  }
  answer.value = solve(width, height, null, null, n);
});

const onClickSolve = () => {
  console.log("onClick");
  answer.value = solve(width, height, null, null, n);
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

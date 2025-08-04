<script setup lang="ts">
// Load image and resize to 200x200 and draw into canvas
import { onMounted } from "vue";

const width = 200;
const height = 200;

// Apply binary Floyd–Steinberg dithering
const dither = (imageData: ImageData): ImageData => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const oldPixel = data[index];
      const newPixel = oldPixel < 128 ? 0 : 255;
      data[index] = newPixel; // R
      data[index + 1] = newPixel; // G
      data[index + 2] = newPixel; // B
      data[index + 3] = 255; // A

      const error = oldPixel - newPixel;
      if (x + 1 < width) data[index + 4] += (error * 7) / 16; // right
      if (x - 1 >= 0 && y + 1 < height)
        data[index + width * 4 - 4] += (error * 3) / 16; // bottom left
      if (y + 1 < height) data[index + width * 4] += (error * 5) / 16; // bottom
      if (x + 1 < width && y + 1 < height)
        data[index + width * 4 + 4] += (error * 1) / 16; // bottom right
    }
  }

  return imageData;
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
});
</script>
<template>
  <div>
    <h1>Reversible stitch</h1>
    <canvas id="front-ref" ref="front-ref" :width :height></canvas>
    <canvas id="back-ref" ref="back-ref" :width :height></canvas>
  </div>
</template>
<style>
canvas {
  width: 400px;
  height: 400px;
}
</style>

// Apply binary Floyd–Steinberg dithering
export const dither = (imageData: ImageData): ImageData => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const oldPixel = (data[index] + data[index + 1] + data[index + 2]) / 3.0; // Average R, G, B
      //   const oldPixel = data[index];
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

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const solve = (
  width: number,
  height: number,
  frontImg: number[][],
  backImg: number[][],
  n: number
) => {
  const answer: { i: number; j: number }[] = Array(n).fill({ i: 0, j: 0 });
  // Inisialize answer with random positions
  for (let i = 0; i < n; i++) {
    answer[i] = {
      i: randomInt(0, width - 1),
      j: randomInt(0, height - 1),
    };
  }
  return answer;
};

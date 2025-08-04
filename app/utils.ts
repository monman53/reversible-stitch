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

const clop = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

// Draw a line using Bresenham's algorithm
const drawLine = (
  img: number[][],
  i1: number,
  j1: number,
  i2: number,
  j2: number
): void => {
  let currentI = i1;
  let currentJ = j1;

  const di = Math.abs(i2 - i1);
  const dj = Math.abs(j2 - j1);

  const stepI = i1 < i2 ? 1 : -1;
  const stepJ = j1 < j2 ? 1 : -1;

  // 誤差項 (Error term)
  // この実装では、dx - dy を初期値とする一般的なバリエーションを採用
  let err = dj - di;

  const height = img.length;
  if (height === 0) return;
  const width = img[0].length;

  while (true) {
    // 座標が画像の範囲内にあるかチェックして描画
    if (
      currentI >= 0 &&
      currentI < height &&
      currentJ >= 0 &&
      currentJ < width
    ) {
      img[currentI][currentJ] = 1;
    }

    // 終点に達したらループを終了
    if (currentI === i2 && currentJ === j2) {
      break;
    }

    const e2 = 2 * err;

    // 次のj座標を決定
    if (e2 >= -di) {
      err -= di;
      currentJ += stepJ;
    }

    // 次のi座標を決定
    if (e2 <= dj) {
      err += dj;
      currentI += stepI;
    }
  }
};

const createImageFromAnswer = (
  answer: { i: number; j: number }[],
  width: number,
  height: number
): number[][] => {
  const img: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );

  for (let i = 0; i < answer.length - 1; i++) {
    const { i: i1, j: j1 } = answer[i];
    const { i: i2, j: j2 } = answer[i + 1];
    drawLine(img, i1, j1, i2, j2);
  }

  return img;
};

const evalSimilarity = (
  img1: number[][],
  img2: number[][],
  width: number,
  height: number
): number => {
  let similarity = 0;
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      if (img1[i][j] === img2[i][j]) {
        similarity++;
      }
    }
  }
  return similarity / (width * height);
};

export const solve = (
  width: number,
  height: number,
  frontImg: number[][],
  backImg: number[][],
  n: number
) => {
  // Inisialize answer with random positions
  const answer: { i: number; j: number }[] = [];
  for (let i = 0; i < n; i++) {
    answer.push({ i: randomInt(0, height - 1), j: randomInt(0, width - 1) });
  }
  // Create images from the answer
  let img = createImageFromAnswer(answer, width, height);

  for (let iter = 0; iter < 10000; iter++) {
    // Randomly select point and move it to a neighboring point
    const idx = randomInt(0, n - 1);
    const oldPoint = answer[idx];
    const newPoint = {
      //   i: clop(oldPoint.i + randomInt(-1, 1), 0, height - 1),
      //   j: clop(oldPoint.j + randomInt(-1, 1), 0, width - 1),
      i: randomInt(0, height - 1),
      j: randomInt(0, width - 1),
    };
    answer[idx] = newPoint;
    // Create new image from the updated answer
    const newImg = createImageFromAnswer(answer, width, height);
    // Evaluate similarity with the front and back images
    const similarity = evalSimilarity(newImg, frontImg, width, height);
    // If the new image is better, keep it
    if (similarity > evalSimilarity(img, frontImg, width, height)) {
      //   img.splice(0, img.length, ...newImg);
      img = newImg;
    } else {
      answer[idx] = oldPoint; // Revert the change
    }
  }

  return answer;
};

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
  refImg: number[][],
  i1: number,
  j1: number,
  i2: number,
  j2: number,
  diff: number
): number => {
  let currentI = i1;
  let currentJ = j1;
  const di = Math.abs(i2 - i1);
  const dj = Math.abs(j2 - j1);
  const stepI = i1 < i2 ? 1 : -1;
  const stepJ = j1 < j2 ? 1 : -1;
  let err = dj - di;
  const height = img.length;
  if (height === 0) return 0;
  const width = img[0].length;
  let similarityDiff = 0;
  while (true) {
    if (
      currentI >= 0 &&
      currentI < height &&
      currentJ >= 0 &&
      currentJ < width
    ) {
      const similarityBefore = -Math.abs(
        img[currentI][currentJ] - refImg[currentI][currentJ]
      );
      img[currentI][currentJ] += diff;
      const similarityAfter = -Math.abs(
        img[currentI][currentJ] - refImg[currentI][currentJ]
      );
      similarityDiff += similarityAfter - similarityBefore;
    }
    if (currentI === i2 && currentJ === j2) {
      break;
    }
    const e2 = 2 * err;
    if (e2 >= -di) {
      err -= di;
      currentJ += stepJ;
    }
    if (e2 <= dj) {
      err += dj;
      currentI += stepI;
    }
  }
  return similarityDiff;
};

const drawEdge = (
  imgFront: number[][],
  imgBack: number[][],
  imgFrontRef: number[][],
  imgBackRef: number[][],
  answer: { i: number; j: number }[],
  idx1: number,
  idx2: number,
  diff: number
): number[] => {
  if (idx1 < 0 || idx2 < 0 || idx1 >= answer.length || idx2 >= answer.length) {
    return [0, 0];
  }
  const { i: i1, j: j1 } = answer[idx1];
  const { i: i2, j: j2 } = answer[idx2];
  if (idx1 % 2 === 0) {
    const similarityDiff = drawLine(
      imgFront,
      imgFrontRef,
      i1,
      j1,
      i2,
      j2,
      diff
    );
    return [similarityDiff, 0];
  } else {
    const similarityDiff = drawLine(imgBack, imgBackRef, i1, j1, i2, j2, diff);
    return [0, similarityDiff];
  }
};

const createImageFromAnswer = (
  imgFrontRef: number[][],
  imgBackRef: number[][],
  answer: { i: number; j: number }[],
  width: number,
  height: number
): number[][][] => {
  const imgFront: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );
  const imgBack: number[][] = Array.from({ length: height }, () =>
    Array(width).fill(0)
  );

  let frontSim = 0;
  let backSim = 0;

  for (let i = 0; i < answer.length - 1; i++) {
    const [dFSim, dBSim] = drawEdge(
      imgFront,
      imgBack,
      imgFrontRef,
      imgBackRef,
      answer,
      i,
      i + 1,
      +1
    );
    frontSim += dFSim;
    backSim += dBSim;
  }

  return [imgFront, imgBack, frontSim, backSim];
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
      similarity += -Math.abs(img1[i][j] - img2[i][j]);
    }
  }
  return similarity;
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
  let [imgFront, imgBack, frontSim, backSim] = createImageFromAnswer(
    frontImg,
    backImg,
    answer,
    width,
    height
  );
  let frontSimilarityOld = evalSimilarity(imgFront, frontImg, width, height);
  let backSimilarityOld = evalSimilarity(imgBack, backImg, width, height);

  for (let iter = 0; iter < 4000000; iter++) {
    // Randomly select point and move it to a neighboring point
    const idx = randomInt(0, n - 1);
    const oldPoint = answer[idx];
    const newPoint = {
      //   i: clop(oldPoint.i + randomInt(-1, 1), 0, height - 1),
      //   j: clop(oldPoint.j + randomInt(-1, 1), 0, width - 1),
      i: randomInt(0, height - 1),
      j: randomInt(0, width - 1),
    };
    const [dBeforeSimFront1, dBeforeSimBack1] = drawEdge(
      imgFront,
      imgBack,
      frontImg,
      backImg,
      answer,
      idx - 1,
      idx,
      -1
    ); // Remove old edge
    const [dBeforeSimFront2, dBeforeSimBack2] = drawEdge(
      imgFront,
      imgBack,
      frontImg,
      backImg,
      answer,
      idx,
      idx + 1,
      -1
    ); // Remove old edge
    const dBeforeSimFront = dBeforeSimFront1 + dBeforeSimFront2;
    const dBeforeSimBack = dBeforeSimBack1 + dBeforeSimBack2;
    answer[idx] = newPoint;
    const [dAfterSimFront1, dAfterSimBack1] = drawEdge(
      imgFront,
      imgBack,
      frontImg,
      backImg,
      answer,
      idx - 1,
      idx,
      +1
    ); // Add new edge
    const [dAfterSimFront2, dAfterSimBack2] = drawEdge(
      imgFront,
      imgBack,
      frontImg,
      backImg,
      answer,
      idx,
      idx + 1,
      +1
    ); // Add new edge
    const dAfterSimFront = dAfterSimFront1 + dAfterSimFront2;
    const dAfterSimBack = dAfterSimBack1 + dAfterSimBack2;
    const frontSimilarityNew =
      frontSimilarityOld + dBeforeSimFront + dAfterSimFront;
    const backSimilarityNew =
      backSimilarityOld + dBeforeSimBack + dAfterSimBack;
    // If the new image is better, keep it
    if (
      frontSimilarityNew + backSimilarityNew >
      frontSimilarityOld + backSimilarityOld
    ) {
      frontSimilarityOld = frontSimilarityNew;
      backSimilarityOld = backSimilarityNew;
      console.log(iter, frontSimilarityNew + backSimilarityNew);
    } else {
      // Otherwise, revert the change
      drawEdge(imgFront, imgBack, frontImg, backImg, answer, idx - 1, idx, -1); // Revert new edge
      drawEdge(imgFront, imgBack, frontImg, backImg, answer, idx, idx + 1, -1); // Revert new edge
      answer[idx] = oldPoint; // Revert the change
      drawEdge(imgFront, imgBack, frontImg, backImg, answer, idx - 1, idx, +1); // Re-add old edge
      drawEdge(imgFront, imgBack, frontImg, backImg, answer, idx, idx + 1, +1); // Re-add old edge
    }
  }

  return answer;
};

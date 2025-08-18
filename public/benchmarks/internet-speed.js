const runTestCase = async () => {
  let startTime, endTime;
  let imageSize = '';
  let image = new Image();
  let speedInMbps = null;

  let imageLink =
    'https://upload.wikimedia.org/wikipedia/commons/3/3f/Fronalpstock_big.jpg';
  let noCacheLink = imageLink + '?nocache=' + Math.random();

  image.onload = async function () {
    endTime = new Date().getTime();

    await fetch(noCacheLink, { cache: 'no-store' }).then((response) => {
      imageSize = response.headers.get('content-length');
      calculateSpeed();
    });
  };

  const calculateSpeed = () => {
    let timeDuration = (endTime - startTime) / 1000;
    let loadedBits = imageSize * 8;
    let speedInBps = (loadedBits / timeDuration).toFixed(2);
    let speedInKbps = (speedInBps / 1024).toFixed(2);
    speedInMbps = (speedInKbps / 1024).toFixed(2);
  };

  const getResult = async () => {
    return new Promise((resolve) => {
      const waitOnResult = () => {
        if (speedInMbps === null) {
          setTimeout(waitOnResult, 50);
        } else resolve(Number(speedInMbps));
      };
      waitOnResult();
    });
  };

  startTime = new Date().getTime();
  image.src = noCacheLink;

  return await getResult();
};

export const runInternetSppedTest = async () => {
  try {
    const ITERATIONS = 10;
    let sum = 0;

    for (let i = 0; i < ITERATIONS; ++i) {
      const result = await runTestCase();
      sum += result;
      await new Promise((r) => setTimeout(r, 100));
    }

    return Math.round(sum / ITERATIONS);
  } catch {
    return 0;
  }
};

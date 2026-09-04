const fs = require("fs");
const path = require("path");

const svgPath = path.resolve(
  __dirname,
  "../images/logo-robia-copilot.svg"
);

const outputPath = path.resolve(
  __dirname,
  "robia-logo.lottie.json"
);

if (!fs.existsSync(svgPath)) {
  console.error("Logo introuvable :", svgPath);
  process.exit(1);
}

const svg = fs.readFileSync(svgPath, "utf8");
const svgBase64 = Buffer.from(svg, "utf8").toString("base64");

function easeKeyframe(t, start, end) {
  return {
    t,
    s: start,
    e: end,
    i: {
      x: [0.42],
      y: [0],
    },
    o: {
      x: [0.58],
      y: [1],
    },
  };
}

function holdKeyframe(t, value) {
  return {
    t,
    s: value,
    h: 1,
  };
}

function staticAnchor() {
  return {
    a: 0,
    k: [540, 331, 0],
  };
}

function animatedOpacity() {
  return {
    a: 1,
    k: [
      holdKeyframe(0, [0]),
      easeKeyframe(10, [0], [100]),
      holdKeyframe(24, [100]),
      easeKeyframe(42, [100], [92]),
      easeKeyframe(64, [92], [100]),
      holdKeyframe(144, [100]),
    ],
  };
}

function animatedScale() {
  return {
    a: 1,
    k: [
      easeKeyframe(0, [91, 91, 100], [104, 104, 100]),
      easeKeyframe(31, [104, 104, 100], [98.5, 98.5, 100]),
      easeKeyframe(52, [98.5, 98.5, 100], [100, 100, 100]),
      holdKeyframe(144, [100, 100, 100]),
    ],
  };
}

function animatedPosition() {
  return {
    a: 1,
    k: [
      easeKeyframe(0, [540, 345, 0], [540, 330, 0]),
      easeKeyframe(42, [540, 330, 0], [540, 331, 0]),
      holdKeyframe(144, [540, 331, 0]),
    ],
  };
}

function animatedRotation() {
  return {
    a: 1,
    k: [
      easeKeyframe(0, [-3.5], [0.7]),
      easeKeyframe(34, [0.7], [-0.15]),
      easeKeyframe(54, [-0.15], [0]),
      holdKeyframe(144, [0]),
    ],
  };
}

const mainLogoLayer = {
  ddd: 0,
  ind: 3,
  ty: 2,
  nm: "Logo principal",
  refId: "logoSvg",
  sr: 1,
  ks: {
    o: animatedOpacity(),
    r: animatedRotation(),
    p: animatedPosition(),
    a: staticAnchor(),
    s: animatedScale(),
  },
  ao: 0,
  ip: 0,
  op: 144,
  st: 0,
  bm: 0,
};

const echoLayer = {
  ddd: 0,
  ind: 2,
  ty: 2,
  nm: "Echo turquoise",
  refId: "logoSvg",
  sr: 1,
  ks: {
    o: {
      a: 1,
      k: [
        holdKeyframe(0, [0]),
        easeKeyframe(16, [0], [18]),
        easeKeyframe(46, [18], [0]),
        holdKeyframe(144, [0]),
      ],
    },
    r: {
      a: 1,
      k: [
        easeKeyframe(0, [-2], [0]),
        holdKeyframe(144, [0]),
      ],
    },
    p: {
      a: 1,
      k: [
        easeKeyframe(0, [540, 331, 0], [544, 331, 0]),
        easeKeyframe(44, [544, 331, 0], [540, 331, 0]),
        holdKeyframe(144, [540, 331, 0]),
      ],
    },
    a: staticAnchor(),
    s: {
      a: 1,
      k: [
        easeKeyframe(0, [94, 94, 100], [108, 108, 100]),
        easeKeyframe(40, [108, 108, 100], [100, 100, 100]),
        holdKeyframe(144, [100, 100, 100]),
      ],
    },
  },
  ao: 0,
  ip: 0,
  op: 144,
  st: 0,
  bm: 0,
};

const shadowLayer = {
  ddd: 0,
  ind: 1,
  ty: 2,
  nm: "Ombre douce",
  refId: "logoSvg",
  sr: 1,
  ks: {
    o: {
      a: 1,
      k: [
        holdKeyframe(0, [0]),
        easeKeyframe(8, [0], [12]),
        easeKeyframe(35, [12], [0]),
        holdKeyframe(144, [0]),
      ],
    },
    r: {
      a: 0,
      k: 0,
    },
    p: {
      a: 1,
      k: [
        easeKeyframe(0, [540, 338, 0], [540, 333, 0]),
        holdKeyframe(144, [540, 333, 0]),
      ],
    },
    a: staticAnchor(),
    s: {
      a: 1,
      k: [
        easeKeyframe(0, [96, 96, 100], [104, 104, 100]),
        easeKeyframe(35, [104, 104, 100], [100, 100, 100]),
        holdKeyframe(144, [100, 100, 100]),
      ],
    },
  },
  ao: 0,
  ip: 0,
  op: 144,
  st: 0,
  bm: 0,
};

const animation = {
  v: "5.12.2",
  fr: 60,
  ip: 0,
  op: 144,
  w: 1080,
  h: 662,
  nm: "ROBIA Copilot - Premium Logo Reveal",
  ddd: 0,

  assets: [
    {
      id: "logoSvg",
      w: 1080,
      h: 662,
      u: "",
      p: "data:image/svg+xml;base64," + svgBase64,
      e: 1,
    },
  ],

  layers: [
    shadowLayer,
    echoLayer,
    mainLogoLayer,
  ],

  markers: [
    {
      tm: 0,
      cm: "Debut",
      dr: 0,
    },
    {
      tm: 10,
      cm: "Reveal",
      dr: 32,
    },
    {
      tm: 42,
      cm: "Overshoot",
      dr: 12,
    },
    {
      tm: 64,
      cm: "Stable",
      dr: 80,
    },
  ],
};

const output = JSON.stringify(animation, null, 2) + "\n";

function writeAnimationFile() {
  if (fs.existsSync(outputPath)) {
    const currentOutput = fs.readFileSync(outputPath, "utf8");

    if (currentOutput.trimEnd() === output.trimEnd()) {
      return false;
    }
  }

  const temporaryPath = outputPath + ".tmp";

  try {
    fs.writeFileSync(temporaryPath, output, "utf8");
    fs.renameSync(temporaryPath, outputPath);
    return true;
  } catch (error) {
    if (fs.existsSync(temporaryPath)) {
      try {
        fs.unlinkSync(temporaryPath);
      } catch {
        // The original write error below is more useful.
      }
    }

    if (error && error.code === "EPERM") {
      throw new Error(
        "Impossible de mettre à jour le fichier Lottie. Fermez Expo/Metro ou tout programme qui utilise " +
          outputPath +
          ", puis relancez ce script.",
        { cause: error }
      );
    }

    throw error;
  }
}

const wasWritten = writeAnimationFile();

console.log("");
console.log("ROBIA Copilot");
console.log(
  wasWritten
    ? "Animation Lottie générée avec succès."
    : "Animation Lottie déjà à jour."
);
console.log(outputPath);

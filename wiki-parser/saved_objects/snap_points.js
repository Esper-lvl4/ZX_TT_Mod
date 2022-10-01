const decks = [
  // Top Deck
  {
    Position: {
      x: 20.33,
      y: 0.98,
      z: 10.27,
    }
  },

  // Bottom Deck
  {
    Position: {
      x: 55.69,
      y: 0.98,
      z: -10.22,
    }
  },
];

const trashes = [
  // Top Trash
  {
    Position: {
      x: 20.33,
      y: 0.98,
      z: 17.74,
    }
  },

  // Bottom Trash
  {
    Position: {
      x: 55.69,
      y: 0.98,
      z: -17.78,
    }
  },
];

const dynamises = [
  // Top Dynamis
  {
    Position: {
      x: 19.52,
      y: 0.98,
      z: 3.7,
    },
    Rotation: {
      x: 0,
      y: 270,
      z: 0.0
    },
  },
  // Top Dynamis face-up
  {
    Position: {
      x: 13,
      y: 0.98,
      z: 3.7,
    },
    Rotation: {
      x: 0,
      y: 270,
      z: 180,
    },
  },

  // Bottom Dynamis
  {
    Position: {
      x: 56.48,
      y: 0.98,
      z: -3.71,
    },
    Rotation: {
      x: 0,
      y: 90,
      z: 0,
    },
  },
  // Bottom Dynamis face-up
  {
    Position: {
      x: 63,
      y: 0.98,
      z: -3.71,
    },
    Rotation: {
      x: 0,
      y: 90,
      z: 180,
    },
  },
];

const charges = [
  // Top Charge
  {
    Position: {
      x: 55.69,
      y: 0.98,
      z: 10.31,
    }
  },
  {
    Position: {
      x: 60.19,
      y: 0.98,
      z: 10.31,
    }
  },
  {
    Position: {
      x: 64.69,
      y: 0.98,
      z: 10.31,
    }
  },
  {
    Position: {
      x: 69.19,
      y: 0.98,
      z: 10.31,
    }
  },

  // Bottom charge
  {
    Position: {
      x: 20.38,
      y: 0.98,
      z: -10.21,
    }
  },
  {
    Position: {
      x: 16,
      y: 0.98,
      z: -10.21,
    }
  },
  {
    Position: {
      x: 11.50,
      y: 0.98,
      z: -10.21,
    }
  },
  {
    Position: {
      x: 7,
      y: 0.98,
      z: -10.21,
    }
  },
];

const lifes = [
  // Top Life
  {
    Position: {
      x: 55.69,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 60.19,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 64.69,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 69.19,
      y: 0.98,
      z: 17.75,
    }
  },

  // Bottom Life
  {
    Position: {
      x: 20.38,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 16,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 11.50,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 7,
      y: 0.98,
      z: -17.78,
    }
  },
];

const resources = [
  // Top Resource
  {
    Position: {
      x: 26.93,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 31.38,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 35.83,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 40.38,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 44.83,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 49.38,
      y: 0.98,
      z: 17.75,
    }
  },
  {
    Position: {
      x: 26.93,
      y: 0.98,
      z: 24.21,
    }
  },
  {
    Position: {
      x: 31.38,
      y: 0.98,
      z: 24.21,
    }
  },
  {
    Position: {
      x: 35.83,
      y: 0.98,
      z: 24.21,
    }
  },
  {
    Position: {
      x: 40.38,
      y: 0.98,
      z: 24.21,
    }
  },
  {
    Position: {
      x: 44.83,
      y: 0.98,
      z: 24.21,
    }
  },
  {
    Position: {
      x: 49.38,
      y: 0.98,
      z: 24.21,
    }
  },

  // Bottom Resource
  {
    Position: {
      x: 26.88,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 31.33,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 35.78,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 40.23,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 44.68,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 49.13,
      y: 0.98,
      z: -17.78,
    }
  },
  {
    Position: {
      x: 26.88,
      y: 0.98,
      z: -24.27,
    }
  },
  {
    Position: {
      x: 31.33,
      y: 0.98,
      z: -24.27,
    }
  },
  {
    Position: {
      x: 35.78,
      y: 0.98,
      z: -24.27,
    }
  },
  {
    Position: {
      x: 40.23,
      y: 0.98,
      z: -24.27,
    }
  },
  {
    Position: {
      x: 44.68,
      y: 0.98,
      z: -24.27,
    }
  },
  {
    Position: {
      x: 49.13,
      y: 0.98,
      z: -24.27,
    }
  },
];

const squares = [
  {
    Position: {
      x: 28.61,
      y: 0.98,
      z: 9.38,
    }
  },
  {
    Position: {
      x: 28.61,
      y: 0.98,
      z: 0,
    }
  },
  {
    Position: {
      x: 28.61,
      y: 0.98,
      z: -9.38,
    }
  },
  {
    Position: {
      x: 38,
      y: 0.98,
      z: 9.38,
    }
  },
  {
    Position: {
      x: 38,
      y: 0.98,
      z: 0,
    }
  },
  {
    Position: {
      x: 38,
      y: 0.98,
      z: -9.38,
    }
  },
  {
    Position: {
      x: 47.39,
      y: 0.98,
      z: 9.38,
    }
  },
  {
    Position: {
      x: 47.39,
      y: 0.98,
      z: 0,
    }
  },
  {
    Position: {
      x: 47.39,
      y: 0.98,
      z: -9.38,
    }
  },
];

module.exports = [
  ...decks,
  ...trashes,
  ...dynamises,
  ...charges,
  ...lifes,
  ...resources,
  ...squares,
];

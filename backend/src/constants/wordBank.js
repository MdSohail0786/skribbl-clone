/**
 * Fallback word bank used when MongoDB is not connected, and as the
 * seed data for `npm run seed`. Categories keep the game extensible —
 * new categories can be added here or via the Word collection.
 */
module.exports = {
  animals: [
    'elephant', 'giraffe', 'penguin', 'kangaroo', 'octopus', 'dolphin',
    'crocodile', 'butterfly', 'squirrel', 'peacock', 'flamingo', 'raccoon',
  ],
  objects: [
    'umbrella', 'telescope', 'guitar', 'backpack', 'candle', 'toothbrush',
    'skateboard', 'headphones', 'wheelchair', 'refrigerator', 'lawnmower', 'trampoline',
  ],
  food: [
    'pizza', 'sandwich', 'pancake', 'watermelon', 'popcorn', 'spaghetti',
    'avocado', 'pretzel', 'cupcake', 'burrito', 'sushi', 'lollipop',
  ],
  places: [
    'volcano', 'lighthouse', 'waterfall', 'castle', 'desert', 'airport',
    'stadium', 'greenhouse', 'submarine', 'campfire', 'library', 'harbor',
  ],
  actions: [
    'juggling', 'sneezing', 'skateboarding', 'painting', 'yawning', 'diving',
    'whispering', 'sprinting', 'balancing', 'sculpting', 'knitting', 'surfing',
  ],
};

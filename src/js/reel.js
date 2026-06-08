// Reel image fetching from Sanity (or fallback to local)

const SANITY = {
  projectId: '76kejomt',
  dataset: 'live',
  apiVersion: '2024-01-01',
};

const LOCAL_REEL = [
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
  'public/img/test_images/placeholder.png',
];

async function fetchReelImages() {
  if (SANITY.projectId === 'xxx') return null;

  const query = encodeURIComponent(`
    *[_type == "photo"] {
      "src": image.asset->url,
    }
  `);

  try {
    const url = `https://${SANITY.projectId}.api.sanity.io/v${SANITY.apiVersion}/data/query/${SANITY.dataset}?query=${query}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.result || []).map(item => item.src).filter(Boolean);
  } catch (err) {
    console.warn('Sanity reel fetch failed, using local fallback:', err);
    return null;
  }
}

// Randomize array in place using Fisher-Yates
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function getReelImages() {
  const sanityImages = await fetchReelImages();
  const images = sanityImages ?? LOCAL_REEL;

  // Shuffle for variety on each page load
  return shuffle([...images]);
}

export { getReelImages };

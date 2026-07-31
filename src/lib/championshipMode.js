const NETLIFY_DEPLOY_PREVIEW_HOST = /^deploy-preview-\d+--amwalkingleague\.netlify\.app$/i;

export const isChampionshipPreviewRequest = ({
  isDevelopment = import.meta.env.DEV,
  hostname = window.location.hostname,
  search = window.location.search,
} = {}) => {
  const previewHost = isDevelopment || NETLIFY_DEPLOY_PREVIEW_HOST.test(hostname);
  return previewHost && new URLSearchParams(search).get('championshipPreview') === '1';
};

export const isChampionshipModeEnabled = (options = {}) => (
  import.meta.env.VITE_CHAMPIONSHIP_MODE === 'true' || isChampionshipPreviewRequest(options)
);

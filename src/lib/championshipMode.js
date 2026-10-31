const NETLIFY_DEPLOY_PREVIEW_HOST = /^deploy-preview-\d+--amwalkingleague\.netlify\.app$/i;

export const isChampionshipPreviewRequest = ({
  isDevelopment = import.meta.env?.DEV,
  hostname = globalThis.location?.hostname ?? '',
  search = globalThis.location?.search ?? '',
} = {}) => {
  const previewHost = isDevelopment || NETLIFY_DEPLOY_PREVIEW_HOST.test(hostname);
  return previewHost && new URLSearchParams(search).get('championshipPreview') === '1';
};

export const isChampionshipModeEnabled = ({
  configuredMode = import.meta.env?.VITE_CHAMPIONSHIP_MODE,
  ...options
} = {}) => (
  configuredMode === 'true' || isChampionshipPreviewRequest(options)
);

/**
 * AM Walking League push notification controls for the Google Sheet.
 *
 * Config can live in script properties or in Leaderboards!A1 note as JSON:
 * {"endpoint":"https://<site>/api/send-notification","adminKey":"..."}
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('AWL Admin')
    .addItem('Send leaderboard push', 'sendLeaderboardPush')
    .addItem('Configure push endpoint', 'showPushConfigHelp')
    .addToUi();
}

function sendLeaderboardPush() {
  const ui = SpreadsheetApp.getUi();
  const confirmation = ui.alert(
    'Send leaderboard push?',
    'This will notify every subscribed AWL user that the leaderboard was updated.',
    ui.ButtonSet.YES_NO,
  );

  if (confirmation !== ui.Button.YES) return;

  const result = sendAwlPush_({
    title: 'Leaderboard Update',
    body: 'New scores are in. Check the leaderboard.',
    url: '/',
    tag: 'awl-leaderboard-update',
  });

  ui.alert(
    'Push sent',
    'Sent: ' + result.sent + '\nFailed: ' + result.failed + '\nExpired removed: ' + result.deleted + '\nSubscribers: ' + result.total,
    ui.ButtonSet.OK,
  );
}

function showPushConfigHelp() {
  SpreadsheetApp.getUi().alert(
    'AWL Push Config',
    'Required script properties:\n\nAWL_PUSH_ENDPOINT\nAWL_PUSH_ADMIN_KEY\n\nThese should match the deployed Netlify send endpoint and ADMIN_API_KEY.',
    SpreadsheetApp.getUi().ButtonSet.OK,
  );
}

function setAwlPushConfig(endpoint, adminKey) {
  if (!endpoint || !adminKey) throw new Error('endpoint and adminKey are required');
  PropertiesService.getScriptProperties().setProperties({
    AWL_PUSH_ENDPOINT: endpoint,
    AWL_PUSH_ADMIN_KEY: adminKey,
  }, true);
  return { success: true };
}

function getPushConfig_() {
  const props = PropertiesService.getScriptProperties();
  let endpoint = props.getProperty('AWL_PUSH_ENDPOINT');
  let adminKey = props.getProperty('AWL_PUSH_ADMIN_KEY');

  if (!endpoint || !adminKey) {
    const sheet = SpreadsheetApp.getActive().getSheetByName('Leaderboards');
    const note = sheet && sheet.getRange('A1').getNote();
    if (note) {
      try {
        const parsed = JSON.parse(note);
        endpoint = endpoint || parsed.endpoint;
        adminKey = adminKey || parsed.adminKey;
      } catch (error) {
        throw new Error('Leaderboards!A1 push config note is not valid JSON.');
      }
    }
  }

  if (!endpoint || !adminKey) {
    throw new Error('Push is not configured. Set script properties or Leaderboards!A1 note with endpoint/adminKey.');
  }

  return { endpoint, adminKey };
}

function sendAwlPush_(payload) {
  const config = getPushConfig_();

  const response = UrlFetchApp.fetch(config.endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.adminKey,
    },
    payload: JSON.stringify(payload || {}),
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const text = response.getContentText();
  let data = {};
  try {
    data = JSON.parse(text || '{}');
  } catch (error) {
    data = { raw: text };
  }

  if (status < 200 || status >= 300) {
    throw new Error('Push request failed (' + status + '): ' + text);
  }

  return data;
}

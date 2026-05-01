// ============================================================
//  CE 議事録アプリ - Apps Script
//  シート名: minutes
// ============================================================
const SHEET_NAME = 'minutes';

function doGet(e) {
  const action = e.parameter.action || '';

  // 接続テスト用
  if (action === 'ping') {
    return json({ ok: true, message: 'pong' });
  }

  // 全件取得（復元用）
  if (action === 'getAll') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) return json({ ok: true, records: [] });

    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) return json({ ok: true, records: [] });

    const headers = rows[0];
    const records = rows.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        const jsonFields = ['members','agendas','actions','repData'];
        if (jsonFields.includes(h)) {
          try { obj[h] = JSON.parse(r[i] || '[]'); } catch { obj[h] = []; }
        } else {
          obj[h] = r[i];
        }
      });
      return obj;
    });

    return json({ ok: true, records });
  }

  return json({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  try {
    const rec = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // シートがなければ作成してヘッダー追加
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        'id','wgId','wgName','session','date','start','end',
        'place','secretary','wgType',
        'members','agendas','actions','repData',
        'nextDate','nextNote','savedAt','syncStatus'
      ]);
      // ヘッダー行を固定
      sheet.setFrozenRows(1);
      // 列幅調整
      sheet.setColumnWidth(1, 180);  // id
      sheet.setColumnWidth(5, 120);  // date
      sheet.setColumnWidth(11, 200); // members
      sheet.setColumnWidth(12, 300); // agendas
      sheet.setColumnWidth(13, 300); // actions
    }

    const row = [
      rec.id || '',
      rec.wgId || '',
      rec.wgName || '',
      rec.session || '',
      rec.date || '',
      rec.start || '',
      rec.end || '',
      rec.place || '',
      rec.secretary || '',
      rec.wgType || 'wg',
      JSON.stringify(rec.members || []),
      JSON.stringify(rec.agendas || []),
      JSON.stringify(rec.actions || []),
      JSON.stringify(rec.repData || {}),
      rec.nextDate || '',
      rec.nextNote || '',
      rec.savedAt || new Date().toISOString(),
      'done',
    ];

    // 既存IDを探して上書き、なければ追加
    const rows = sheet.getDataRange().getValues();
    const ids = rows.slice(1).map(r => r[0]);
    const existingIdx = ids.indexOf(rec.id);

    if (existingIdx >= 0) {
      const rowNum = existingIdx + 2; // ヘッダー行 + 1始まり
      sheet.getRange(rowNum, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return json({ ok: true });

  } catch(err) {
    return json({ ok: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

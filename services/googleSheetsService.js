//    ██████╗  ██████╗  ██████╗  ██████╗ ██╗     ███████╗
//   ██╔════╝ ██╔═══██╗██╔═══██╗██╔════╝ ██║     ██╔════╝
//   ██║  ███╗██║   ██║██║   ██║██║  ███╗██║     █████╗  
//   ██║   ██║██║   ██║██║   ██║██║   ██║██║     ██╔══╝  
//   ╚██████╔╝╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
//    ╚═════╝  ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
//    Google Sheets Service - Dengan Debugging

const { google } = require('googleapis');

let authClient = null;
let initError = null;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

/**
 * Inisialisasi Google Auth Client
 */
async function getAuthClient() {
  // Return cached client jika sudah ada
  if (authClient) {
    return authClient;
  }

  try {
    console.log('[GS] ========================================');
    console.log('[GS] Initializing Google Sheets connection...');
    console.log('[GS] Spreadsheet ID:', SPREADSHEET_ID || 'NOT SET');
    console.log('[GS] Client Email:', process.env.GOOGLE_SHEETS_CLIENT_EMAIL || 'NOT SET');
    
    // Cek environment variables
    if (!SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID is not set in .env');
    }
    
    if (!process.env.GOOGLE_SHEETS_CLIENT_EMAIL) {
      throw new Error('GOOGLE_SHEETS_CLIENT_EMAIL is not set in .env');
    }
    
    if (!process.env.GOOGLE_SHEETS_PRIVATE_KEY) {
      throw new Error('GOOGLE_SHEETS_PRIVATE_KEY is not set in .env');
    }

    // Fix private key - handle berbagai format
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
    
    // Debug: tampilkan sebagian private key
    console.log('[GS] Private Key (first 50 chars):', privateKey.substring(0, 50) + '...');
    console.log('[GS] Private Key length:', privateKey.length);
    console.log('[GS] Contains BEGIN:', privateKey.includes('BEGIN PRIVATE KEY'));
    console.log('[GS] Contains END:', privateKey.includes('END PRIVATE KEY'));
    console.log('[GS] Contains \\n:', privateKey.includes('\\n'));
    console.log('[GS] Contains newline:', privateKey.includes('\n'));
    
    // Fix 1: Ganti literal \n dengan newline asli
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      console.log('[GS] Fixed \\n to real newlines');
    }
    
    // Fix 2: Pastikan format PEM benar
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Coba tambahkan header jika hilang
      privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey + '\n-----END PRIVATE KEY-----';
      console.log('[GS] Added PEM headers');
    }
    
    // Fix 3: Clean up extra quotes
    privateKey = privateKey.replace(/^["']|["']$/g, '');
    
    console.log('[GS] Creating JWT client...');
    
    authClient = new google.auth.JWT(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL.trim(),
      null,
      privateKey,
      ['https://www.googleapis.com/auth/spreadsheets']
    );
    
    // Test koneksi
    console.log('[GS] Testing connection...');
    await authClient.authorize();
    console.log('[GS] Authorization successful!');
    
    initError = null;
    console.log('[GS] ========================================');
    
    return authClient;
    
  } catch (error) {
    initError = error;
    console.error('[GS] ========================================');
    console.error('[GS] INIT ERROR:', error.message);
    console.error('[GS] Full error:', error);
    console.error('[GS] ========================================');
    throw error;
  }
}

/**
 * Mendapatkan Sheets API instance
 */
async function getSheets() {
  const auth = await getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

/**
 * Membaca data dari sheet
 * @param {string} sheetName - Nama sheet
 * @returns {Array} - Data dari sheet
 */
async function getSheetData(sheetName) {
  try {
    console.log(`[GS] Reading sheet: "${sheetName}"`);
    
    // Cek cache error
    if (initError && !authClient) {
      console.log('[GS] Previous init error, retrying...');
      authClient = null;
      initError = null;
    }
    
    const sheets = await getSheets();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
    });
    
    const values = response.data.values || [];
    console.log(`[GS] Sheet "${sheetName}": ${values.length} rows`);
    
    if (values.length > 0) {
      console.log(`[GS] Headers:`, values[0]);
    } else {
      console.log(`[GS] Sheet "${sheetName}" is empty`);
    }
    
    return values;
    
  } catch (error) {
    console.error(`[GS] Error reading "${sheetName}":`, error.message);
    
    // Log detail error
    if (error.response) {
      console.error('[GS] Response status:', error.response.status);
      console.error('[GS] Response data:', JSON.stringify(error.response.data));
    }
    
    // Jika auth error, reset client
    if (error.message.includes('auth') || error.message.includes('permission') || error.message.includes('invalid_grant')) {
      authClient = null;
      initError = error;
    }
    
    // Return array kosong, jangan throw
    return [];
  }
}

/**
 * Menambah data ke sheet
 */
async function appendToSheet(sheetName, values) {
  try {
    console.log(`[GS] Appending to "${sheetName}":`, values);
    
    const sheets = await getSheets();
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [values] },
    });
    
    console.log(`[GS] Append success: ${response.data.updates?.updatedRows || '?'} rows`);
    return response.data;
    
  } catch (error) {
    console.error(`[GS] Error appending to "${sheetName}":`, error.message);
    throw error;
  }
}

/**
 * Update cell tertentu
 */
async function updateSheetCell(sheetName, row, column, value) {
  try {
    const colLetter = String.fromCharCode(64 + column);
    const range = `${sheetName}!${colLetter}${row}`;
    
    console.log(`[GS] Updating ${range} = "${value}"`);
    
    const sheets = await getSheets();
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: range,
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[value]] },
    });
    
    console.log(`[GS] Update success`);
    return response.data;
    
  } catch (error) {
    console.error(`[GS] Error updating cell:`, error.message);
    throw error;
  }
}

/**
 * Hapus row
 */
async function deleteSheetRow(sheetName, rowIndex) {
  try {
    console.log(`[GS] Deleting row ${rowIndex} from "${sheetName}"`);
    
    const sheets = await getSheets();
    
    // Dapatkan sheet ID
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      includeGridData: false,
    });
    
    const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: sheet.properties.sheetId,
              dimension: 'ROWS',
              startIndex: rowIndex - 1,
              endIndex: rowIndex,
            }
          }
        }]
      }
    });
    
    console.log(`[GS] Delete success`);
    
  } catch (error) {
    console.error(`[GS] Error deleting row:`, error.message);
    throw error;
  }
}

/**
 * Test koneksi
 */
async function testConnection() {
  try {
    console.log('[GS] Testing connection...');
    
    // Cek env
    const checks = {
      SPREADSHEET_ID: !!process.env.SPREADSHEET_ID,
      CLIENT_EMAIL: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      PRIVATE_KEY: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    };
    
    console.log('[GS] Env checks:', checks);
    
    if (!checks.SPREADSHEET_ID || !checks.CLIENT_EMAIL || !checks.PRIVATE_KEY) {
      return {
        success: false,
        message: 'Missing environment variables',
        checks
      };
    }
    
    // Test auth
    await getAuthClient();
    
    // Test baca
    const sheets = await getSheets();
    const testData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'A1:A1',
    });
    
    return {
      success: true,
      message: 'Google Sheets connected successfully',
      spreadsheetId: SPREADSHEET_ID,
      checks
    };
    
  } catch (error) {
    return {
      success: false,
      message: error.message,
      error: error.toString()
    };
  }
}

module.exports = {
  getSheetData,
  appendToSheet,
  updateSheetCell,
  deleteSheetRow,
  testConnection,
  getAuthClient,
};
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { DOMO_CLIENT_ID, DOMO_CLIENT_SECRET, DOMO_DATASET_ID } = process.env;

class DomoAPI {
  constructor(clientId, clientSecret) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseURL = 'https://api.domo.com/v1';
    this.token = null;
  }

  // 1️⃣ Get OAuth token
  async authenticate() {
    const url = 'https://api.domo.com/oauth/token?grant_type=client_credentials';
    const authHeader = 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

    try {
      const response = await axios.get(url, { headers: { Authorization: authHeader } });
      this.token = response.data.access_token;
      return this.token;
    } catch (err) {
      throw new Error('Error getting token: ' + (err.response?.data || err.message));
    }
  }

  // 2️⃣ List datasets
  async listDatasets() {
    if (!this.token) await this.authenticate();
    const url = `${this.baseURL}/datasets`;
    try {
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${this.token}` } });
      return response.data.map(d => d.id);
    } catch (err) {
      throw new Error('Error listing datasets: ' + (err.response?.data || err.message));
    }
  }

  // 3️⃣ Export a dataset as CSV
  async exportDataset(datasetId, limit = 3, offset = 0) {
    if (!this.token) await this.authenticate();
    const url = `${this.baseURL}/datasets/${datasetId}/data?includeHeader=true&limit=${limit}&offset=${offset}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${this.token}` },
        responseType: 'text',
      });
      return response.data;
    } catch (err) {
      console.error(`Error exporting dataset ${datasetId}:`, err.response?.data || err.message);
      return '';
    }
  }
}

// 4️⃣ CSV Utilities
function saveCSV(filePath, csvContent) {
  fs.writeFileSync(filePath, csvContent, 'utf8');
  console.log(`✅ CSV saved to ${filePath}`);
}

function logFirstNRows(filePath, n = 10) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  console.log(`\n📄 First ${n} rows:\n`);
  console.log(lines.slice(0, n).join('\n'));
}

// 5️⃣ Main flow
(async () => {
  try {
    const domo = new DomoAPI(DOMO_CLIENT_ID, DOMO_CLIENT_SECRET);

    console.log('🔹 Listing datasets...');
    const datasetIds = await domo.listDatasets();

    if (!datasetIds.length) {
      console.log('⚠️ No datasets found.');
      return;
    }

    let combinedCSV = '';
    let isFirstFile = true;

    for (const id of datasetIds) {
      const csv = await domo.exportDataset(id);
      if (!csv) continue;

      const lines = csv.trim().split('\n');
      if (isFirstFile) {
        combinedCSV += `datasetId,${lines[0]}\n`;
        isFirstFile = false;
      }

      const dataLines = lines.slice(1).map(line => `${id},${line}`).join('\n');
      combinedCSV += dataLines + '\n';
    }

    const outputPath = path.join(__dirname, 'combined_datasets.csv');
    saveCSV(outputPath, combinedCSV);
    logFirstNRows(outputPath, 10);

  } catch (err) {
    console.error('❌ Script failed:', err.message);
  }
})();

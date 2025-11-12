const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Use environment variables for security
const clientId = process.env.DOMO_CLIENT_ID;
const clientSecret = process.env.DOMO_CLIENT_SECRET;

async function getAccessToken() {
  const url = 'https://api.domo.com/oauth/token?grant_type=client_credentials';
  const authHeader = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await axios.get(url, {
      headers: { Authorization: authHeader },
      maxBodyLength: Infinity,
    });
    return response.data.access_token;
  } catch (err) {
    console.error('❌ Error getting token:', err.response?.data || err.message);
    throw err;
  }
}

async function listDatasets(token) {
  console.log('in list DataSet')
  const url = 'https://api.domo.com/v1/datasets';
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      maxBodyLength: Infinity,
    });
    const ids = response.data.map(d => d.id);
    console.log(`✅ Found ${ids.length} datasets`);
    return ids;
  } catch (err) {
    console.error('❌ Error listing datasets:', err.response?.data || err.message);
    throw err;
  }
}

function logFirst10Rows(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  const first10 = lines.slice(0, 10);

  console.log('\n📄 First 10 records in the CSV:\n');
  console.log(first10.join('\n'));
}

async function exportDataset(token, datasetId, limit = 3, offset = 0) {
    console.log('in exportDataSet')

  const url = `https://api.domo.com/v1/datasets/${datasetId}/data?includeHeader=true&limit=${limit}&offset=${offset}`;
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'text', // get CSV text, not JSON
      maxBodyLength: Infinity,
    });
    console.log(`📦 Exported data from dataset: ${datasetId}`);
    return response.data;
  } catch (err) {
    console.error(`❌ Error exporting dataset ${datasetId}:`, err.response?.data || err.message);
    return '';
  }
}

async function main() {
  try {
    const token = await getAccessToken();
    const datasetIds = await listDatasets(token);

    if (!datasetIds.length) {
      console.log('⚠️ No datasets found.');
      return;
    }

    let combinedCSV = '';
    let isFirstFile = true;

    for (const id of datasetIds) {
      const csv = await exportDataset(token, id);
      if (!csv) continue;

      const lines = csv.trim().split('\n');

      if (isFirstFile) {
        // Add "datasetId" column header first time only
        const header = `datasetId,${lines[0]}`;
        combinedCSV += header + '\n';
        isFirstFile = false;
      }

      // Add datasetId prefix to each data line (skip header line)
      const dataLines = lines.slice(1).map(line => `${id},${line}`).join('\n');
      combinedCSV += dataLines + '\n';
    }

    // Save combined CSV file
    const outputPath = path.join(__dirname, 'combined_datasets.csv');
    fs.writeFileSync(outputPath, combinedCSV, 'utf8');
    console.log(`✅ Combined CSV saved to ${outputPath}`);
    logFirst10Rows(outputPath);


  } catch (err) {
    console.error('❌ Script failed:', err.message);
  }
}

main();

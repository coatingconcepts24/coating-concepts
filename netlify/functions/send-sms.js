exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ACCOUNT_SID = 'AC3e195ed62ea3df1ba3cb8d0da3cbc9e5';
  const AUTH_TOKEN = 'a5cdd9a53754e3ea582b63acdbe1cbe4';
  const FROM_NUMBER = '+18449931958';
  const OWNER_NUMBER = '+12195952695';

  let body;
  try { body = JSON.parse(event.body); } catch(e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, phone, email, wheels, size, finish, metallic, colorName, clearCoat, services, tireSize, tireBrand, dateStr } = body;

  const serviceLabels = {
    'full': 'Full Service (drop-off)',
    'rims-tires': 'Rims with Tires',
    'bare': 'Bare Rims Only',
    'quote-tires': 'Tire Quote Requested'
  };

  const serviceList = (services||[]).map(s => serviceLabels[s]||s).join(', ') || 'Not specified';

  const ownerMsg = [
    '🔧 New Coating Concepts Booking!',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email}`,
    `Wheels: ${wheels}x ${size}`,
    `Service: ${serviceList}`,
    `Finish: ${finish||'TBD'}${metallic?' - '+metallic:''}`,
    `Clear Coat: ${clearCoat==='yes'?'Yes':'No'}`,
    `Color: ${colorName||'TBD'}`,
    tireSize ? `Tire Size: ${tireSize}` : null,
    tireBrand ? `Tire Brand: ${tireBrand}` : null,
    `Drop-off: ${dateStr}`
  ].filter(Boolean).join('\n');

  const credentials = Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
  const headers = {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  async function sendSMS(to, msg) {
    const params = new URLSearchParams({ To: to, From: FROM_NUMBER, Body: msg });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}/Messages.json`, {
      method: 'POST', headers, body: params.toString()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Twilio error');
    return data;
  }

  try {
    await sendSMS(OWNER_NUMBER, ownerMsg);
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch(err) {
    console.error('SMS error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

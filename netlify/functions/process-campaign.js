const { authenticate } = require('./session');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const user = authenticate(event);
  if (!user) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  try {
    const data = JSON.parse(event.body);

    // Validate required fields
    if (!data.name || data.name.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Campaign name is required' }) };
    }
    if (!data.message || data.message.trim().length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message content is required' }) };
    }
    if (data.message.length > 1600) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Message too long (max 1600 characters)' }) };
    }
    if (!data.consentConfirmed) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Consent confirmation is required' }) };
    }

    // In a real implementation, this would save to a database or send via SMS provider
    // For now, just return a success response

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        campaignId: 'camp_' + Date.now().toString(36),
        status: data.status || 'draft',
        message: 'Campaign processed successfully'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('Campaign processing error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Processing failed' })
    };
  }
};

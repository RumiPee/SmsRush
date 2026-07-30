const { authenticate } = require('./session');

// Optional AI API integration
const AI_API_KEY = process.env.AI_API_KEY;

// Local generator (mirror of client-side generator for server use)
function generateLocalSMS(options) {
  const {
    business = 'our business',
    product = 'our product',
    offer = 'special offer',
    goal = 'Promote a Product',
    tone = 'Professional',
    cta = 'Learn More',
    link = '',
  } = options;

  const goalPhrases = {
    'Promote a Product': ['Check out our new', 'Discover our', 'Get your hands on'],
    'Announce an Offer': ['We\'re excited to offer', 'Announcing', 'Take advantage of'],
    'Share an Update': ['Here\'s the latest', 'Update on', 'News about'],
    'Drive Website Visits': ['Visit our site to', 'Check it out at', 'See more on our website'],
    'Generate Leads': ['Interested in', 'Want to learn more about', 'Sign up to find out'],
    'Invite Customers to an Event': ['Join us for', 'You\'re invited to', 'RSVP now for'],
    'Send a Reminder': ['Don\'t forget', 'Reminder about', 'Just a reminder'],
    'Customer Follow-Up': ['Following up on', 'Checking in about', 'How did it go with'],
    'Customer Engagement': ['We value your feedback', 'Tell us what you think', 'We\'d love to hear'],
  };

  const ctaPhrases = {
    'Shop Now': ['Shop now and save', 'Get it now', 'Order today'],
    'Learn More': ['Learn more today', 'Find out more', 'Discover more'],
    'Visit Our Website': ['Visit our website', 'Check us out online', 'Go to our site'],
    'Contact Us': ['Contact us now', 'Reach out today', 'Get in touch'],
    'Reply to This Message': ['Reply to this message', 'Text us back', 'Send us a reply'],
    'Get Started': ['Get started now', 'Start today', 'Begin your journey'],
    'Book Now': ['Book your spot', 'Reserve now', 'Schedule today'],
    'Claim Your Offer': ['Claim your offer', 'Redeem now', 'Get your deal'],
  };

  const phrase = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const goalPhrase = phrase(goalPhrases[goal] || goalPhrases['Promote a Product']);
  const ctaPhrase = phrase(ctaPhrases[cta] || ctaPhrases['Learn More']);

  let message = `${goalPhrase} ${product}. ${offer}. ${ctaPhrase}`;
  if (link) message += ` ${link}`;
  return message;
}

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
    const options = JSON.parse(event.body);

    // Validate inputs
    if (!options.goal) options.goal = 'Promote a Product';
    if (!options.tone) options.tone = 'Professional';
    if (!options.cta) options.cta = 'Learn More';
    if (options.product && options.product.length > 100) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Product name too long' }) };
    }
    if (options.offer && options.offer.length > 200) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Offer too long' }) };
    }

    let message;

    // Try AI if configured
    if (AI_API_KEY) {
      try {
        // Placeholder for AI integration
        // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
        // message = response.data.choices[0].message.content;
        throw new Error('AI not configured');
      } catch (aiErr) {
        console.warn('AI failed, using local fallback');
        message = generateLocalSMS(options);
      }
    } else {
      message = generateLocalSMS(options);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ post: message, message }),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    console.error('Generation error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Generation failed' })
    };
  }
};

/**
 * Local template-based SMS generator
 */

const TONES = {
  Professional: {
    greeting: ['Hello', 'Greetings', 'Good day'],
    style: 'formal',
  },
  Friendly: {
    greeting: ['Hey', 'Hi', 'Hello there'],
    style: 'casual',
  },
  Promotional: {
    greeting: ['Don\'t miss out', 'Limited time', 'Special offer'],
    style: 'promotional',
  },
  Urgent: {
    greeting: ['Act now', 'Last chance', 'Time sensitive'],
    style: 'urgent',
  },
  Exciting: {
    greeting: ['Exciting news', 'Great announcement', 'Big update'],
    style: 'excited',
  },
  Simple: {
    greeting: ['Just a quick note', 'Heads up', 'Quick update'],
    style: 'simple',
  },
  Luxury: {
    greeting: ['Exclusive', 'Premium', 'For our distinguished'],
    style: 'luxury',
  },
  Casual: {
    greeting: ['Hey there', 'What\'s up', 'Just so you know'],
    style: 'casual',
  },
};

const GOAL_PHRASES = {
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

const CTA_PHRASES = {
  'Shop Now': ['Shop now and save', 'Get it now', 'Order today'],
  'Learn More': ['Learn more today', 'Find out more', 'Discover more'],
  'Visit Our Website': ['Visit our website', 'Check us out online', 'Go to our site'],
  'Contact Us': ['Contact us now', 'Reach out today', 'Get in touch'],
  'Reply to This Message': ['Reply to this message', 'Text us back', 'Send us a reply'],
  'Get Started': ['Get started now', 'Start today', 'Begin your journey'],
  'Book Now': ['Book your spot', 'Reserve now', 'Schedule today'],
  'Claim Your Offer': ['Claim your offer', 'Redeem now', 'Get your deal'],
};

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSMS(options) {
  const {
    business = 'our business',
    product = 'our product',
    offer = 'special offer',
    goal = 'Promote a Product',
    tone = 'Professional',
    cta = 'Learn More',
    link = '',
  } = options;

  const toneData = TONES[tone] || TONES.Professional;
  const goalPhrase = randomItem(GOAL_PHRASES[goal] || GOAL_PHRASES['Promote a Product']);
  const ctaPhrase = randomItem(CTA_PHRASES[cta] || CTA_PHRASES['Learn More']);

  let message = '';

  // Build the message based on style
  const style = toneData.style;

  switch (style) {
    case 'formal':
      message = `${randomItem(toneData.greeting)}, ${goalPhrase} ${product}. ${offer}. ${ctaPhrase}.${link ? ` ${link}` : ''}`;
      break;
    case 'casual':
      message = `${randomItem(toneData.greeting)}! ${goalPhrase} ${product} – ${offer}. ${ctaPhrase}${link ? ` at ${link}` : ''}!`;
      break;
    case 'promotional':
      message = `${randomItem(toneData.greeting)}! ${goalPhrase} ${product} for ${offer}. ${ctaPhrase} today${link ? ` at ${link}` : ''}!`;
      break;
    case 'urgent':
      message = `${randomItem(toneData.greeting)}! ${goalPhrase} ${product} – ${offer}. ${ctaPhrase} now${link ? ` at ${link}` : ''}!`;
      break;
    case 'excited':
      message = `${randomItem(toneData.greeting)}! 🎉 ${goalPhrase} ${product} with ${offer}. ${ctaPhrase}${link ? ` at ${link}` : ''}!`;
      break;
    case 'simple':
      message = `${randomItem(toneData.greeting)}: ${goalPhrase} ${product}. ${offer}. ${ctaPhrase}${link ? ` ${link}` : ''}.`;
      break;
    case 'luxury':
      message = `${randomItem(toneData.greeting)} ${goalPhrase} ${product}. Experience ${offer}. ${ctaPhrase}${link ? ` at ${link}` : ''}.`;
      break;
    default:
      message = `${goalPhrase} ${product}. ${offer}. ${ctaPhrase}${link ? ` ${link}` : ''}`;
  }

  // Clean up and ensure proper spacing
  message = message.replace(/\s+/g, ' ').trim();

  return message;
}

export function generateSMSVariation(options) {
  return generateSMS(options);
}

export function estimateSegments(text) {
  // GSM 7-bit encoding: 160 characters per segment
  // Unicode (UCS-2): 70 characters per segment
  // Simple estimation: assume GSM 7-bit with some Unicode characters
  const length = text.length;
  let segments = 1;
  if (length > 160) {
    segments = Math.ceil(length / 153); // 153 for multi-part GSM
  }
  if (length > 70) {
    // Check for Unicode characters (simple heuristic)
    const unicodeCount = (text.match(/[^\x00-\x7F]/g) || []).length;
    if (unicodeCount > 0) {
      segments = Math.ceil(length / 67); // 67 for multi-part Unicode
    }
  }
  return Math.max(1, segments);
}

export function generateDefaultTemplates() {
  return [
    { id: 'tpl_welcome', name: 'Welcome Message', body: 'Welcome to {business}! We\'re excited to have you. Reply to this message to get started.' },
    { id: 'tpl_promo', name: 'Product Promotion', body: 'Check out our latest product: {product}. {offer}. Shop now at {link}.' },
    { id: 'tpl_offer', name: 'Limited-Time Offer', body: 'Limited time offer! {offer} on {product}. Don\'t miss out – {cta} today.' },
    { id: 'tpl_reminder', name: 'Appointment Reminder', body: 'Reminder: Your appointment with {business} is coming up. Reply to confirm.' },
    { id: 'tpl_event', name: 'Event Reminder', body: 'Don\'t forget our event! Join us for {product}. {cta} now.' },
    { id: 'tpl_followup', name: 'Customer Follow-Up', body: 'Following up on your recent experience with {business}. We\'d love your feedback.' },
    { id: 'tpl_order', name: 'Order Update', body: 'Your order is ready! Pick up at {business} or visit {link} for details.' },
    { id: 'tpl_thanks', name: 'Thank-You Message', body: 'Thank you for choosing {business}! We appreciate your business and look forward to serving you again.' },
    { id: 'tpl_feedback', name: 'Feedback Request', body: 'We value your opinion! Please take a moment to share your feedback about {product}. {link}' },
    { id: 'tpl_website', name: 'Website Promotion', body: 'Visit our website at {link} to learn more about {product} and our latest offers.' },
  ];
}

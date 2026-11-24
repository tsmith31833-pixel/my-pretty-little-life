/* =====================================================================
   Money & Grace Co. site settings
   Edit this file to connect checkout, forms and social links.
   Nothing here is connected yet, so the site never pretends it is.
   ===================================================================== */
window.MG_CONFIG = {

  /* Your public contact email. It fills the Contact page and the footer.
     While it is still the placeholder below, the Contact page says so. */
  email: 'hello@moneyandgraceco.com',

  /* Products.
     A product shows "Available now" and a Buy Now button ONLY when
     status is 'available' AND checkout is a real https:// link (for example
     your Payhip product link, https://payhip.com/b/AbCd).
     Anything else shows "Coming soon" with a Notify me signup. */
  products: {
    'monthly-money-planner':  { status: 'coming-soon', checkout: '' },
    'budget-planner':         { status: 'coming-soon', checkout: '' },
    'debt-repayment-tracker': { status: 'coming-soon', checkout: '' },
    'savings-challenges':     { status: 'coming-soon', checkout: '' }
  },

  /* Form endpoints. Paste a URL that accepts a normal form POST
     (for example a Formspree form URL like https://formspree.io/f/abcdwxyz).
     Leave a value empty and that form tells visitors it is not connected yet.
       newsletter: homepage, footer, Money Edit and free-kit signups
       notify:     "Notify me" on Coming soon products
       community:  Join the free Money & Grace community (Reset Room)
       wins:       Share your win (Reset Room)
       contact:    Contact page form */
  forms: {
    newsletter: '',
    notify: '',
    community: '',
    wins: '',
    contact: ''
  },

  /* What visitors see when they submit a form that is not connected yet. */
  notConnectedMessages: {
    newsletter: 'Our email list is not open yet, so your email was not sent or saved. Please check back soon.',
    notify: 'Launch alerts are not open yet, so your email was not sent or saved. Please check back soon.',
    community: 'The free community opens soon. Your details were not sent or saved yet, so please check back shortly.',
    wins: 'Win sharing is not open yet, so nothing was sent or saved. Please check back soon.',
    contact: 'Our contact form is not connected yet, so this message was not sent. Please email us directly instead.'
  },

  /* Social profile links. Replace each with your own profile URL. */
  social: {
    instagram: 'https://www.instagram.com/',
    pinterest: 'https://www.pinterest.com/',
    tiktok: 'https://www.tiktok.com/',
    youtube: 'https://www.youtube.com/'
  }
};

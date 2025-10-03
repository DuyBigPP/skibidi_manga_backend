const slugify = require('slugify');

/**
 * Create URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
const createSlug = (text) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
};

/**
 * Create unique slug with random suffix
 * @param {string} text - Text to slugify
 * @returns {string} Unique slug
 */
const createUniqueSlug = (text) => {
  const baseSlug = createSlug(text);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
};

module.exports = { createSlug, createUniqueSlug };


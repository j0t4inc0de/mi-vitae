/**
 * Cloudflare Pages Function: Dynamic XML Sitemap Endpoint
 * Routes GET /sitemap.xml directly to the dynamic sitemap generator
 */
export { onRequestGet } from './api/sitemap.js'

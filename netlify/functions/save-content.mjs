import { onRequestPost } from '../../functions/api/save-content.js';

export default async (request) => onRequestPost({
  request,
  env: process.env
});

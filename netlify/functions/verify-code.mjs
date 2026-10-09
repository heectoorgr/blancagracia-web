import { onRequestPost } from '../../functions/api/verify-code.js';

export default async (request) => onRequestPost({
  request,
  env: process.env
});

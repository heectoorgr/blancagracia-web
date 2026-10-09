import { onRequestPost } from '../../functions/api/send-alert.js';

export default async (request) => onRequestPost({
  request,
  env: process.env
});

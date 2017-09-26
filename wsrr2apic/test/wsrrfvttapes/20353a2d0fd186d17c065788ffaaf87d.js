var path = require("path");

/**
 * GET /WSRR/7.5/Content/d94257d9-d39a-4a91.975e.9b545b9b5ecf?type=relative
 *
 * accept: application/json
 * host: srb84a.hursley.ibm.com:9443
 * authorization: Basic dXNlcjp1c2Vy
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("x-powered-by", "Servlet/3.0");
  res.setHeader("expires", "-1");
  res.setHeader("content-type", "text/xml");
  res.setHeader("content-length", "885");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=vdDkMdUsIX8PjzX2oSOa2cJYoAFvaUMK/h27vVkUZpt/twinTytIbwbyJvHs7+oqEmn2zX8goDF0p4g1vLqHULSUGmkkqVB0hJyr3L8d/fojP1sEycZRHc7X15BzIhsn6GG7h/xjFKvgf/1Q9IjIc6lb9V87cu+Bres05XXVqx2bdhyCA6oYbc7AhzPA2Qs6GbsMoiSlIz7RqE7X8gApdnEvsVUJf4yaG4l0xGC5Dbe5w7f1Kpf81IMsmRjA+y5cW2G8VWsBNvtFpMELEciryPw0R3L5j83K3B3g9YcdKT4pNHdQXKlVkr26aMdigp4ZYmmZovwFuo0VvODyB1QLpfQNfMWgUhXP6BUOYV+Z+EH280fFaj27EFpC9r78gbR2YpBT8TGAw2UWPBaGVuGGhO6oxE9rkbKA5cIBI7vH1YBkEoDriMD3qDqpCU9gfBD/s0hthxgLDsAdSgsxlCQ+0TOGHgtMbI7Vyp6mvd4kEy6TpcY7Qt8GYaptrB93N1ZQzWjk00cd8lnyLlM0Pjuq7sPcYYgcTQ/s7yuRn1t4VcxFVgeINU30FmVYj8Eknt8KRuvmMU2hOI2kPRPy14rXz5HzwAQ4wjroPlpd8A8ER3DkpjlACTc88nuRHuVjlor/bv26rWuGtWjVpqT50oZyzBd1lUpSyidBu1Z+tVclY/mPPdNNGvCy/7N4R9uRglLP; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Tue, 23 Aug 2016 13:09:58 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48ZGVmaW5pdGlvbnMgeG1sbnM9Imh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzZGwvIiBuYW1lPSJNYXRoU2VydmVyIiB0YXJnZXROYW1lc3BhY2U9Imh0dHA6Ly9tYXRoLnBvdC5pYm0uY29tIiB4bWxuczppbnRmPSJodHRwOi8vbWF0aC5wb3QuaWJtLmNvbSIgeG1sbnM6dG5zPSJodHRwOi8vbWF0aC5wb3QuaWJtLmNvbSIgeG1sbnM6d3NkbHNvYXA9Imh0dHA6Ly9zY2hlbWFzLnhtbHNvYXAub3JnL3dzZGwvc29hcC8iIHhtbG5zOndzaT0iaHR0cDovL3dzLWkub3JnL3Byb2ZpbGVzL2Jhc2ljLzEuMS94c2QiIHhtbG5zOnhzZD0iaHR0cDovL3d3dy53My5vcmcvMjAwMS9YTUxTY2hlbWEiPgogIDxkb2N1bWVudGF0aW9uPgogICAgPGFwcGluZm8gc291cmNlPSJXTVFJX0FQUElORk8iPgogICAgICA8TVJXU0RMQXBwSW5mbyBpbXBvcnRlZD0idHJ1ZSIvPgogICAgPC9hcHBpbmZvPgogIDwvZG9jdW1lbnRhdGlvbj4KCiAgICA8aW1wb3J0IGxvY2F0aW9uPSI4ZWM1MTk4ZS1iZWRiLTRiZTQuYWU1NS5iYTk1MWNiYTU1NzQ/dHlwZT1yZWxhdGl2ZSIgbmFtZXNwYWNlPSJodHRwOi8vbWF0aC5wb3QuaWJtLmNvbSIvPgoKICAgIDxzZXJ2aWNlIG5hbWU9Ik1hdGhTZXJ2ZXJTZXJ2aWNlIj4KICAgICAgICA8cG9ydCBiaW5kaW5nPSJpbnRmOk1hdGhTZXJ2ZXJTb2FwQmluZGluZyIgbmFtZT0iTWF0aFNlcnZlclBvcnQiPgogICAgICAgICAgICA8d3NkbHNvYXA6YWRkcmVzcyBsb2NhdGlvbj0iaHR0cDovL3NyYjg0YS5odXJzbGV5LmlibS5jb206OTA4MC9NYXRoU2VydmljZS9NYXRoU2VydmVyU2VydmljZSIvPgogICAgICAgIDwvcG9ydD4KICAgIDwvc2VydmljZT4KCjwvZGVmaW5pdGlvbnM+", "base64"));
  res.end();

  return __filename;
};

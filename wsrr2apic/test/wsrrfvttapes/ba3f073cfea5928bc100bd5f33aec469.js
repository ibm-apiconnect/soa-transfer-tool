var path = require("path");

/**
 * GET /WSRR/7.5/Metadata/JSON/Query/getGovernanceRecord?p1=aa867aaa-c596-46a4.83b5.affba8afb525
 *
 * accept: application/json
 * host: srb84a.hursley.ibm.com:9443
 * authorization: Basic dXNlcjp1c2Vy
 * connection: close
 */

module.exports = function (req, res) {
  res.statusCode = 200;

  res.setHeader("x-powered-by", "Servlet/3.0");
  res.setHeader("content-type", "application/json");
  res.setHeader("content-length", "1019");
  res.setHeader("expires", "-1");
  res.setHeader("content-language", "en-US");
  res.setHeader("set-cookie", ["LtpaToken2=YJgN01vg0Z7FvobvrvyG4rgXC82aXvqL1yY/XI42lfOLlR8y7RByechOEo9zRuWiQk5l020PRqxkO69mGopSfV5vhrayL8tyDspwONM95vnfohnMq/px2TuHNYTi6n1K8/2donG0SyRLyPcXRuxT8YVApL0AuJjxzLtzSrlR8VDLXMYCyfea/m6Q9+4g5SV9qWALhiwRY8xx8jKlkcIBvRaIn9RvOJGBki4RSww2ImqqgyElOYOhvjkE1KVoKkv+v/oZIxyjs+p91YYIeWM2MqTiWHrp3Qn2xsn/aiPCi0/rCiivbnOPABFQsvJ/mWn5FZtRLicQmgyGDCskvVkOmYrc50HHichlbMsV/J6D36MCgtXxMFMNjOuWzPnL82Cv3TOaMVveZ0rJZb0NAZPEXsx6ZgK9lQGxuMYWxMLGBE6By4P7hcPZN8892sxP4X8melQYOqjhCGi/P5paQFf4Ml87/D/V07e5BlG4z6N3kqbcck/A/UAxgKuL/Pk8lTN7YA/hjWbSRseCuoh/AfDz3kz5V9AUpHYMXPWzAIARZiv7t+J5ucTLxa8xKA5eSLX4WtQMhMmojLcq17xNuikV2gVHhmVW/I4Asexm0ySlDslLOCoK68Z7SMncU1tqVNjkz4iNguRfXcf/1h9nyyqEy5gxT8pbC1MbFOaYTiV172T/YbMZQ8K7G+7T86MKw4Zg; Path=/; Secure; HttpOnly"]);
  res.setHeader("connection", "Close");
  res.setHeader("date", "Fri, 23 Dec 2016 21:01:38 GMT");
  res.setHeader("cache-control", "no-cache=\"set-cookie, set-cookie2\"");

  res.setHeader("x-yakbak-tape", path.basename(__filename, ".js"));

  res.write(new Buffer("W3sicHJvcGVydGllcyI6W3sidmFsdWUiOiJjZmQ2MTBjZi1mZTI0LTQ0NTYuYmI4Ny5lMDg4MzZlMDg3M2QiLCJuYW1lIjoiYnNyVVJJIn0seyJ2YWx1ZSI6IiIsIm5hbWUiOiJuYW1lIn0seyJ2YWx1ZSI6IiIsIm5hbWUiOiJuYW1lc3BhY2UifSx7InZhbHVlIjoiIiwibmFtZSI6InZlcnNpb24ifSx7InZhbHVlIjoiIiwibmFtZSI6ImRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6ImFkbWluIiwibmFtZSI6Im93bmVyIn0seyJ2YWx1ZSI6IjE0NjI5NzI1NzY1OTEiLCJuYW1lIjoibGFzdE1vZGlmaWVkIn0seyJ2YWx1ZSI6IjE0NjI0NjAwMTkzODciLCJuYW1lIjoiY3JlYXRpb25UaW1lc3RhbXAifSx7InZhbHVlIjoid2FzYWRtaW4iLCJuYW1lIjoibGFzdE1vZGlmaWVkQnkifSx7InZhbHVlIjoiYWE4NjdhYWEtYzU5Ni00NmE0LjgzYjUuYWZmYmE4YWZiNTI1IiwibmFtZSI6ImVudGl0eUJzclVSSSJ9LHsidmFsdWUiOiJodHRwOlwvXC93d3cuaWJtLmNvbVwveG1sbnNcL3Byb2RcL3NlcnZpY2VyZWdpc3RyeVwvbGlmZWN5Y2xlXC92NnIzXC9MaWZlY3ljbGVEZWZpbml0aW9uI0NhcGFiaWxpdHlBcHByb3ZlZCIsIm5hbWUiOiJzdGF0ZSJ9XSwic3Vic2NyaWJlZFRyYW5zaXRpb25zIjpbXSwic3Vic2NyaWJlZE9wZXJhdGlvbnMiOltdLCJ0eXBlIjoiR292ZXJuYW5jZVJlY29yZCIsInJlbGF0aW9uc2hpcHMiOlt7InRhcmdldFR5cGUiOiJHZW5lcmljT2JqZWN0IiwibmFtZSI6ImdvdmVybmVkT2JqZWN0cyIsInByaW1hcnlUeXBlIjoiaHR0cDpcL1wvd3d3LmlibS5jb21cL3htbG5zXC9wcm9kXC9zZXJ2aWNlcmVnaXN0cnlcL3Byb2ZpbGVcL3Y2cjNcL0dvdmVybmFuY2VFbmFibGVtZW50TW9kZWwjQnVzaW5lc3NTZXJ2aWNlIiwidGFyZ2V0QnNyVVJJIjoiYWE4NjdhYWEtYzU5Ni00NmE0LjgzYjUuYWZmYmE4YWZiNTI1In1dLCJic3JVUkkiOiJjZmQ2MTBjZi1mZTI0LTQ0NTYuYmI4Ny5lMDg4MzZlMDg3M2QiLCJ0YXJnZXRDbGFzc2lmaWNhdGlvbnMiOltdLCJjbGFzc2lmaWNhdGlvbnMiOltdfV0=", "base64"));
  res.end();

  return __filename;
};

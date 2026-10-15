import "dotenv/config";
import axios from "axios";

const res = await axios.post(
  `${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
  {
    source_code: "name = input()\nprint('Hello ' + name)",
    language_id: 71,
    stdin: "CodeArena",
    expected_output: "Hello CodeArena",
  },
  { headers: { "Content-Type": "application/json" } }
);

console.log(res.data.status.description);
console.log(res.data.stdout);
console.log(res.data.time, res.data.memory);